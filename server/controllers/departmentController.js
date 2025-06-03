const Department = require('../models/Department');
const Company = require('../models/Company');

// @desc    Create a new department
// @route   POST /api/departments
// @access  Private (CompanyAdmin, EmployeeAdmin)
const createDepartment = async (req, res) => {
    const { name, status } = req.body;
    const companyId = req.user.companyId;

    if (!name) {
        return res.status(400).json({ message: 'Department name is required.' });
    }

    try {
        const departmentExists = await Department.findOne({ name, companyId });
        if (departmentExists) {
            return res.status(400).json({ message: 'Department with this name already exists for your company.' });
        }

        const department = new Department({
            name,
            companyId,
            status: status || 'ACTIVE',
        });

        const savedDepartment = await department.save();
        res.status(201).json(savedDepartment);
    } catch (error) {
        console.error('Create department error:', error);
        res.status(500).json({ message: 'Server error creating department.', error: error.message });
    }
};

// @desc    Get all departments for the company
// @route   GET /api/departments
// @access  Private (CompanyAdmin, EmployeeAdmin, HrManager)
const getDepartments = async (req, res) => {
    try {
        const departments = await Department.find({ companyId: req.user.companyId });
        res.json(departments);
    } catch (error) {
        console.error('Get departments error:', error);
        res.status(500).json({ message: 'Server error fetching departments.', error: error.message });
    }
};

// @desc    Get a single department by ID
// @route   GET /api/departments/:id
// @access  Private (CompanyAdmin, EmployeeAdmin, HrManager)
const getDepartmentById = async (req, res) => {
    try {
        const department = await Department.findOne({ _id: req.params.id, companyId: req.user.companyId });
        if (!department) {
            return res.status(404).json({ message: 'Department not found or does not belong to your company.' });
        }
        res.json(department);
    } catch (error) {
        console.error('Get department by ID error:', error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Department not found (Invalid ID format).' });
        }
        res.status(500).json({ message: 'Server error fetching department.', error: error.message });
    }
};

// @desc    Update a department
// @route   PUT /api/departments/:id
// @access  Private (CompanyAdmin, EmployeeAdmin)
const updateDepartment = async (req, res) => {
    const { name, status } = req.body;
    try {
        const department = await Department.findOne({ _id: req.params.id, companyId: req.user.companyId });
        if (!department) {
            return res.status(404).json({ message: 'Department not found or does not belong to your company.' });
        }

        if (name && name !== department.name) {
            const departmentExists = await Department.findOne({ name, companyId: req.user.companyId });
            if (departmentExists) {
                 return res.status(400).json({ message: 'Another department with this name already exists for your company.' });
            }
            department.name = name;
        }
        if (status) department.status = status;

        const updatedDepartment = await department.save();
        res.json(updatedDepartment);
    } catch (error) {
        console.error('Update department error:', error);
        res.status(500).json({ message: 'Server error updating department.', error: error.message });
    }
};

// @desc    Delete a department (use with caution, consider deactivation or checking for employees first)
// @route   DELETE /api/departments/:id
// @access  Private (CompanyAdmin, EmployeeAdmin)
const deleteDepartment = async (req, res) => {
    try {
        const department = await Department.findOne({ _id: req.params.id, companyId: req.user.companyId });
        if (!department) {
            return res.status(404).json({ message: 'Department not found or does not belong to your company.' });
        }

        // Optional: Check if any employees are assigned to this department before deletion
        // const employeesInDept = await Employee.countDocuments({ departmentId: req.params.id, companyId: req.user.companyId });
        // if (employeesInDept > 0) {
        //     return res.status(400).json({ message: 'Cannot delete department. Employees are still assigned to it. Please reassign them first.' });
        // }

        // await department.remove(); // Mongoose 5.x
        await Department.deleteOne({ _id: req.params.id, companyId: req.user.companyId }); // Mongoose 6+

        res.json({ message: 'Department removed successfully.' });
    } catch (error) {
        console.error('Delete department error:', error);
        res.status(500).json({ message: 'Server error deleting department.', error: error.message });
    }
};

module.exports = {
    createDepartment,
    getDepartments,
    getDepartmentById,
    updateDepartment,
    deleteDepartment,
};
