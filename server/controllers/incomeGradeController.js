const IncomeGrade = require('../models/IncomeGrade');
const Company = require('../models/Company');

// @desc    Create a new income grade
// @route   POST /api/income-grades
// @access  Private (CompanyAdmin, EmployeeAdmin, HrManager)
const createIncomeGrade = async (req, res) => {
    const {
        gradeName, basicSalary, houseAllowance, transportAllowance,
        hardshipAllowance, specialAllowance, isActive
    } = req.body;
    const companyId = req.user.companyId;

    if (!gradeName || basicSalary === undefined) { // basicSalary can be 0, so check undefined
        return res.status(400).json({ message: 'Grade name and basic salary are required.' });
    }

    try {
        const gradeExists = await IncomeGrade.findOne({ gradeName, companyId });
        if (gradeExists) {
            return res.status(400).json({ message: 'Income grade with this name already exists for your company.' });
        }

        const incomeGrade = new IncomeGrade({
            gradeName,
            companyId,
            basicSalary,
            houseAllowance: houseAllowance || 0,
            transportAllowance: transportAllowance || 0,
            hardshipAllowance: hardshipAllowance || 0,
            specialAllowance: specialAllowance || 0,
            isActive: isActive !== undefined ? isActive : true,
        });

        const savedIncomeGrade = await incomeGrade.save();
        res.status(201).json(savedIncomeGrade);
    } catch (error) {
        console.error('Create income grade error:', error);
        res.status(500).json({ message: 'Server error creating income grade.', error: error.message });
    }
};

// @desc    Get all income grades for the company
// @route   GET /api/income-grades
// @access  Private (CompanyAdmin, EmployeeAdmin, HrManager)
const getIncomeGrades = async (req, res) => {
    try {
        const incomeGrades = await IncomeGrade.find({ companyId: req.user.companyId });
        res.json(incomeGrades);
    } catch (error) {
        console.error('Get income grades error:', error);
        res.status(500).json({ message: 'Server error fetching income grades.', error: error.message });
    }
};

// @desc    Get a single income grade by ID
// @route   GET /api/income-grades/:id
// @access  Private (CompanyAdmin, EmployeeAdmin, HrManager)
const getIncomeGradeById = async (req, res) => {
    try {
        const incomeGrade = await IncomeGrade.findOne({ _id: req.params.id, companyId: req.user.companyId });
        if (!incomeGrade) {
            return res.status(404).json({ message: 'Income grade not found or does not belong to your company.' });
        }
        res.json(incomeGrade);
    } catch (error) {
        console.error('Get income grade by ID error:', error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Income grade not found (Invalid ID format).' });
        }
        res.status(500).json({ message: 'Server error fetching income grade.', error: error.message });
    }
};

// @desc    Update an income grade
// @route   PUT /api/income-grades/:id
// @access  Private (CompanyAdmin, EmployeeAdmin, HrManager)
const updateIncomeGrade = async (req, res) => {
    const {
        gradeName, basicSalary, houseAllowance, transportAllowance,
        hardshipAllowance, specialAllowance, isActive
    } = req.body;
    try {
        const incomeGrade = await IncomeGrade.findOne({ _id: req.params.id, companyId: req.user.companyId });
        if (!incomeGrade) {
            return res.status(404).json({ message: 'Income grade not found or does not belong to your company.' });
        }

        if (gradeName && gradeName !== incomeGrade.gradeName) {
            const gradeExists = await IncomeGrade.findOne({ gradeName, companyId: req.user.companyId });
            if (gradeExists) {
                 return res.status(400).json({ message: 'Another income grade with this name already exists.' });
            }
            incomeGrade.gradeName = gradeName;
        }

        if (basicSalary !== undefined) incomeGrade.basicSalary = basicSalary;
        if (houseAllowance !== undefined) incomeGrade.houseAllowance = houseAllowance;
        if (transportAllowance !== undefined) incomeGrade.transportAllowance = transportAllowance;
        if (hardshipAllowance !== undefined) incomeGrade.hardshipAllowance = hardshipAllowance;
        if (specialAllowance !== undefined) incomeGrade.specialAllowance = specialAllowance;
        if (isActive !== undefined) incomeGrade.isActive = isActive;

        const updatedIncomeGrade = await incomeGrade.save();
        res.json(updatedIncomeGrade);
    } catch (error) {
        console.error('Update income grade error:', error);
        res.status(500).json({ message: 'Server error updating income grade.', error: error.message });
    }
};

// @desc    Delete an income grade (use with caution, check if employees are assigned)
// @route   DELETE /api/income-grades/:id
// @access  Private (CompanyAdmin, EmployeeAdmin, HrManager)
const deleteIncomeGrade = async (req, res) => {
    try {
        const incomeGrade = await IncomeGrade.findOne({ _id: req.params.id, companyId: req.user.companyId });
        if (!incomeGrade) {
            return res.status(404).json({ message: 'Income grade not found.' });
        }

        // TODO: Check if any active employees are assigned to this income grade
        // const Employee = require('../models/Employee'); // Import Employee model
        // const employeesOnGrade = await Employee.countDocuments({ incomeGradeId: req.params.id, workStatus: 'ACTIVE', companyId: req.user.companyId });
        // if (employeesOnGrade > 0) {
        //     return res.status(400).json({ message: 'Cannot delete income grade. Active employees are still assigned to it.' });
        // }

        await IncomeGrade.deleteOne({ _id: req.params.id, companyId: req.user.companyId });
        res.json({ message: 'Income grade removed successfully.' });
    } catch (error) {
        console.error('Delete income grade error:', error);
        res.status(500).json({ message: 'Server error deleting income grade.', error: error.message });
    }
};

module.exports = {
    createIncomeGrade,
    getIncomeGrades,
    getIncomeGradeById,
    updateIncomeGrade,
    deleteIncomeGrade,
};
