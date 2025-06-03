const Advance = require('../models/Advance');
const Damage = require('../models/Damage');
const Reimbursement = require('../models/Reimbursement');
const Employee = require('../models/Employee'); // To validate employee exists

// Generic function to create an operation
const createOperation = (Model) => async (req, res) => {
    const { employeeId, amount, reason, description, dateIssued, dateIncurred, dateClaimed } = req.body;
    const companyId = req.user.companyId;
    const createdByUserId = req.user._id;

    if (!employeeId || amount === undefined) {
        return res.status(400).json({ message: 'Employee ID and amount are required.' });
    }
    if (parseFloat(amount) <= 0) {
        return res.status(400).json({ message: 'Amount must be greater than zero.' });
    }

    try {
        const employee = await Employee.findOne({ _id: employeeId, companyId });
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found or does not belong to this company.' });
        }

        const operationData = {
            employeeId,
            companyId,
            amount,
            status: 'PENDING', // Default status
            // Fields specific to model
            ...(reason && { reason }), // For Advance
            ...(description && { description }), // For Damage, Reimbursement
            ...(dateIssued && { dateIssued }), // For Advance
            ...(dateIncurred && { dateIncurred }), // For Damage
            ...(dateClaimed && { dateClaimed }), // For Reimbursement
            // approvedBy: createdByUserId // Or set on approval
        };

        const operation = new Model(operationData);
        const savedOperation = await operation.save();
        res.status(201).json(savedOperation);
    } catch (error) {
        console.error(`Create ${Model.modelName} error:`, error);
        res.status(500).json({ message: `Server error creating ${Model.modelName}.`, error: error.message });
    }
};

// Generic function to get operations
const getOperations = (Model) => async (req, res) => {
    const companyId = req.user.companyId;
    const { employeeId, status, month, year } = req.query;
    const filter = { companyId };

    if (employeeId) filter.employeeId = employeeId;
    if (status) filter.status = status;

    // TODO: Add month/year filtering based on dateIssued/dateIncurred/dateClaimed
    // if (month && year) {
    //     const startDate = new Date(year, month - 1, 1);
    //     const endDate = new Date(year, month, 0, 23, 59, 59);
    //     // Adjust field based on model, e.g. dateIssued for Advance
    //     filter.dateIssued = { $gte: startDate, $lte: endDate };
    // }

    try {
        const operations = await Model.find(filter)
            .populate('employeeId', 'firstName lastName nationalId')
            .populate('approvedBy', 'email')
            .sort({ createdAt: -1 });
        res.json(operations);
    } catch (error) {
        console.error(`Get ${Model.modelName}s error:`, error);
        res.status(500).json({ message: `Server error fetching ${Model.modelName}s.`, error: error.message });
    }
};

// Generic function to update status of an operation
const updateOperationStatus = (Model) => async (req, res) => {
    const { status, payrollId, deductedOnPayPeriod, paidOnPayPeriod } = req.body; // New status from body
    const operationId = req.params.id;
    const companyId = req.user.companyId;
    const approvedByUserId = req.user._id;

    if (!status) {
        return res.status(400).json({ message: 'New status is required.' });
    }
    // Add validation for allowed statuses per model if necessary

    try {
        const operation = await Model.findOne({ _id: operationId, companyId });
        if (!operation) {
            return res.status(404).json({ message: `${Model.modelName} not found or does not belong to this company.` });
        }

        operation.status = status;
        if (status === 'APPROVED' || status === 'REJECTED') {
            operation.approvedBy = approvedByUserId;
            operation.dateApproved = Date.now();
        }
        if (payrollId) operation.payrollId = payrollId; // Link to payroll where it was processed
        if (deductedOnPayPeriod) operation.deductedOnPayPeriod = deductedOnPayPeriod;
        if (paidOnPayPeriod) operation.paidOnPayPeriod = paidOnPayPeriod;


        const updatedOperation = await operation.save();
        res.json(updatedOperation);
    } catch (error) {
        console.error(`Update ${Model.modelName} status error:`, error);
        res.status(500).json({ message: `Server error updating ${Model.modelName} status.`, error: error.message });
    }
};

// Export specific controllers
module.exports = {
    createAdvance: createOperation(Advance),
    getAdvances: getOperations(Advance),
    updateAdvanceStatus: updateOperationStatus(Advance),

    createDamage: createOperation(Damage),
    getDamages: getOperations(Damage),
    updateDamageStatus: updateOperationStatus(Damage),

    createReimbursement: createOperation(Reimbursement),
    getReimbursements: getOperations(Reimbursement),
    updateReimbursementStatus: updateOperationStatus(Reimbursement),
};
