const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const { processEmployeePayroll, getPayrollSettings } = require('../services/payrollService');
const Setting = require('../models/Setting');

// @desc    Run payroll for specified employees (or all active in company) for a given month/year
// @route   POST /api/payrolls/run
// @access  Private (CompanyAdmin, EmployeeAdmin, HrManager)
const runPayroll = async (req, res) => {
    const { month, year, employeeIds } = req.body; // employeeIds is an array, if null/empty, run for all active
    const companyId = req.user.companyId;
    const processedByUserId = req.user._id;

    if (!month || !year) {
        return res.status(400).json({ message: 'Month and year are required to run payroll.' });
    }

    try {
        let employeesToProcess = [];
        if (employeeIds && employeeIds.length > 0) {
            employeesToProcess = await Employee.find({
                _id: { $in: employeeIds },
                companyId,
                workStatus: 'ACTIVE' // Ensure they are active
            }).select('_id');
        } else {
            employeesToProcess = await Employee.find({ companyId, workStatus: 'ACTIVE' }).select('_id');
        }

        if (employeesToProcess.length === 0) {
            return res.status(400).json({ message: 'No active employees found to process payroll for.' });
        }

        // Check if payroll already exists for these employees for this month/year
        const existingPayrolls = await Payroll.find({
            employeeId: { $in: employeesToProcess.map(e => e._id) },
            month,
            year,
            companyId
        }).select('employeeId');

        if (existingPayrolls.length > 0) {
            const processedEmpIds = existingPayrolls.map(p => p.employeeId.toString());
            employeesToProcess = employeesToProcess.filter(emp => !processedEmpIds.includes(emp._id.toString()));
            if (employeesToProcess.length === 0) {
                 return res.status(400).json({ message: `Payroll already processed for all specified employees for ${month}, ${year}.` });
            }
            // Optionally, inform about already processed employees
        }

        const results = [];
        const errors = [];

        for (const emp of employeesToProcess) {
            try {
                const payrollRecord = await processEmployeePayroll(emp._id, companyId, month, year, processedByUserId);
                results.push(payrollRecord);
            } catch (error) {
                console.error(`Error processing payroll for employee ${emp._id}:`, error.message);
                errors.push({ employeeId: emp._id, message: error.message });
            }
        }

        if (errors.length > 0) {
            return res.status(207).json({ // Multi-Status
                message: 'Payroll processing completed with some errors.',
                processedCount: results.length,
                errorCount: errors.length,
                results,
                errors
            });
        }

        res.status(201).json({
            message: 'Payroll processed successfully for all selected employees.',
            results
        });

    } catch (error) {
        console.error('Run payroll controller error:', error);
        res.status(500).json({ message: 'Server error during payroll processing.', error: error.message });
    }
};

// @desc    Get all payroll records (payslips) for the company, with filters
// @route   GET /api/payrolls
// @access  Private (CompanyAdmin, EmployeeAdmin, HrManager)
const getPayrolls = async (req, res) => {
    const companyId = req.user.companyId;
    const { employeeId, month, year, status } = req.query;
    const filter = { companyId };

    if (employeeId) filter.employeeId = employeeId;
    if (month) filter.month = month;
    if (year) filter.year = parseInt(year);
    if (status) filter.status = status;

    try {
        const payrolls = await Payroll.find(filter)
            .populate('employeeId', 'firstName lastName nationalId departmentId')
            .populate({
                path: 'employeeId',
                populate: { path: 'departmentId', select: 'name' }
            })
            .populate('processedBy', 'email')
            .populate('approvedBy', 'email')
            .sort({ year: -1, month: -1, createdAt: -1 });
        res.json(payrolls);
    } catch (error) {
        console.error('Get payrolls error:', error);
        res.status(500).json({ message: 'Server error fetching payroll records.', error: error.message });
    }
};

// @desc    Get a single payslip by ID
// @route   GET /api/payrolls/:id
// @access  Private (CompanyAdmin, EmployeeAdmin, HrManager, or concerned Employee)
const getPayslipById = async (req, res) => {
    try {
        const payslip = await Payroll.findOne({ _id: req.params.id, companyId: req.user.companyId })
            .populate('employeeId', 'firstName lastName nationalId bankName accountNo departmentId')
            .populate({
                path: 'employeeId',
                populate: [
                    { path: 'departmentId', select: 'name' },
                    { path: 'incomeGradeId', select: 'gradeName' } // Though snapshot is there, good for reference
                ]
            })
            .populate('companyId', 'name taxPin location')
            .populate('processedBy', 'email')
            .populate('approvedBy', 'email');

        if (!payslip) {
            return res.status(404).json({ message: 'Payslip not found or does not belong to your company.' });
        }

        // Allow employee to view their own payslip
        if (req.user.role === 'employee' && req.user.employeeId.toString() !== payslip.employeeId._id.toString()) {
             return res.status(403).json({ message: 'Forbidden: You can only view your own payslips.' });
        }

        res.json(payslip);
    } catch (error) {
        console.error('Get payslip by ID error:', error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Payslip not found (Invalid ID format).' });
        }
        res.status(500).json({ message: 'Server error fetching payslip.', error: error.message });
    }
};

// @desc    Update payslip status (e.g., approve, mark as paid)
// @route   PUT /api/payrolls/:id/status
// @access  Private (CompanyAdmin, EmployeeAdmin, HrManager)
const updatePayslipStatus = async (req, res) => {
    const { status, notes } = req.body;
    const payslipId = req.params.id;
    const companyId = req.user.companyId;
    const userId = req.user._id;

    if (!status) {
        return res.status(400).json({ message: 'New status is required.' });
    }
    // Validate allowed statuses: e.g. PENDING_APPROVAL -> APPROVED -> PAID
    // Add more robust status transition logic if needed

    try {
        const payslip = await Payroll.findOne({ _id: payslipId, companyId });
        if (!payslip) {
            return res.status(404).json({ message: 'Payslip not found.' });
        }

        payslip.status = status;
        if (status === 'APPROVED') {
            payslip.approvedBy = userId;
            payslip.dateApproved = Date.now();
        }
        if (status === 'PAID') {
            payslip.paymentDate = Date.now(); // Or allow manual date input
        }
        if (notes) payslip.notes = notes;

        const updatedPayslip = await payslip.save();
        res.json(updatedPayslip);
    } catch (error) {
        console.error('Update payslip status error:', error);
        res.status(500).json({ message: 'Server error updating payslip status.', error: error.message });
    }
};

// @desc    Controller to allow admin to set/update payroll settings like Tax/NHIF rates
// @route   POST /api/payrolls/settings
// @access  Private (CompanyAdmin)
const updatePayrollSettings = async (req, res) => {
    const { settingName, value, description, forCompanyId } = req.body; // forCompanyId can make it company specific or null for global

    if (!settingName || !value) {
        return res.status(400).json({ message: 'Setting name and value are required.' });
    }

    const companyId = req.user.companyId; // The admin's company
    const targetCompanyId = forCompanyId === 'GLOBAL' ? null : (forCompanyId || companyId);


    // Ensure company admin can only set for their own company or global if that's allowed by design
    if (targetCompanyId && targetCompanyId.toString() !== companyId.toString() && forCompanyId !== 'GLOBAL') {
         // If a company admin tries to set for another company explicitly.
         // Global settings might be restricted to a super-admin role not yet defined.
         // For now, let's assume company admin can only set for their own company.
        if (targetCompanyId !== companyId.toString()) {
            return res.status(403).json({ message: "Forbidden: You can only manage settings for your own company." });
        }
    }


    try {
        let setting = await Setting.findOne({ settingName, companyId: targetCompanyId });
        if (setting) {
            setting.value = value;
            if (description) setting.description = description;
            setting.isActive = true; // Ensure it's active on update
        } else {
            setting = new Setting({
                settingName,
                value,
                description,
                companyId: targetCompanyId,
                isActive: true,
            });
        }
        const savedSetting = await setting.save();
        res.status(201).json(savedSetting);
    } catch (error) {
        console.error('Update payroll settings error:', error);
        res.status(500).json({ message: 'Server error updating payroll settings.', error: error.message });
    }
};


module.exports = {
    runPayroll,
    getPayrolls,
    getPayslipById,
    updatePayslipStatus,
    updatePayrollSettings,
    // Expose for testing or direct use if needed
    _internal: { calculateNSSF, calculateNHIF, calculatePAYE }
};
