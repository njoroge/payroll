const Employee = require('../models/Employee');
const User = require('../models/User');
const Company = require('../models/Company');
const Department = require('../models/Department');
const IncomeGrade = require('../models/IncomeGrade');

// @desc    Create a new employee
// @route   POST /api/employees
// @access  Private (HRManager, EmployeeAdmin, CompanyAdmin)
const createEmployee = async (req, res) => {
    const {
        nationalId, firstName, lastName, surname, phoneNo, personalEmail, dob, gender,
        kraPin, nhifNo, nssfNo, bankName, accountNo, maritalStatus, incomeGradeId,
        nextOfKin, departmentId, employmentStartDate, workStatus,
        userEmail, userPassword, userRole // For creating associated user login
    } = req.body;

    const companyId = req.user.companyId; // Assuming HR/Admin is linked to a company

    if (!nationalId || !firstName || !lastName || !incomeGradeId || !departmentId || !companyId) {
        return res.status(400).json({ message: 'Missing required employee fields (nationalId, firstName, lastName, incomeGradeId, departmentId).' });
    }

    try {
        const employeeExists = await Employee.findOne({ nationalId, companyId });
        if (employeeExists) {
            return res.status(400).json({ message: 'Employee with this National ID already exists in this company.' });
        }

        if (personalEmail) {
            const personalEmailExists = await Employee.findOne({ personalEmail, companyId });
            if (personalEmailExists) {
                return res.status(400).json({ message: 'Employee with this personal email already exists in this company.' });
            }
        }
        if (kraPin) {
             const kraPinExists = await Employee.findOne({ kraPin, companyId });
            if (kraPinExists) {
                return res.status(400).json({ message: 'Employee with this KRA PIN already exists in this company.' });
            }
        }


        // Validate department and incomeGrade belong to the company
        const department = await Department.findOne({ _id: departmentId, companyId });
        if (!department) return res.status(400).json({ message: 'Department not found or does not belong to this company.' });

        const incomeGrade = await IncomeGrade.findOne({ _id: incomeGradeId, companyId });
        if (!incomeGrade) return res.status(400).json({ message: 'Income grade not found or does not belong to this company.' });

        let newUserId = null;
        if (userEmail && userPassword && userRole) {
            const userExists = await User.findOne({ email: userEmail });
            if (userExists) {
                return res.status(400).json({ message: 'User account with this email already exists.' });
            }
            const newUser = new User({
                email: userEmail,
                password: userPassword,
                role: userRole,
                companyId: companyId,
            });
            const savedUser = await newUser.save();
            newUserId = savedUser._id;
        }

        const employee = new Employee({
            nationalId, firstName, lastName, surname, phoneNo, personalEmail, dob, gender,
            kraPin, nhifNo, nssfNo, bankName, accountNo, maritalStatus, incomeGradeId,
            nextOfKin, departmentId, employmentStartDate, workStatus,
            companyId,
            userId: newUserId, // Link to user account if created
        });

        const savedEmployee = await employee.save();

        if(newUserId){ // If user was created, link employeeId back to user
            await User.findByIdAndUpdate(newUserId, { employeeId: savedEmployee._id });
        }

        res.status(201).json(savedEmployee);

    } catch (error) {
        console.error('Create employee error:', error);
        if (error.code === 11000) { // Duplicate key error
             // More specific error message based on error.keyValue
            const field = Object.keys(error.keyValue)[0];
            return res.status(400).json({ message: `Duplicate value for ${field}: ${error.keyValue[field]}.` });
        }
        res.status(500).json({ message: 'Server error creating employee.', error: error.message });
    }
};

// @desc    Get all employees for the logged-in user's company
// @route   GET /api/employees
// @access  Private (HRManager, EmployeeAdmin, CompanyAdmin)
const getEmployees = async (req, res) => {
    try {
        // Assuming protect middleware adds user and thus companyId to req
        const employees = await Employee.find({ companyId: req.user.companyId })
            .populate('departmentId', 'name')
            .populate('incomeGradeId', 'gradeName basicSalary')
            .populate('userId', 'email role isActive');
        res.json(employees);
    } catch (error) {
        console.error('Get employees error:', error);
        res.status(500).json({ message: 'Server error fetching employees.', error: error.message });
    }
};

// @desc    Get a single employee by ID
// @route   GET /api/employees/:id
// @access  Private (HRManager, EmployeeAdmin, CompanyAdmin, or self)
const getEmployeeById = async (req, res) => {
    try {
        const employee = await Employee.findOne({ _id: req.params.id, companyId: req.user.companyId })
            .populate('departmentId', 'name')
            .populate('incomeGradeId')
            .populate('userId', 'email role isActive')
            .populate('companyId', 'name taxPin');

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found or not part of your company.' });
        }

        // Allow employee to view their own details
        if (req.user.role === 'employee' && req.user.employeeId.toString() !== employee._id.toString()) {
            return res.status(403).json({ message: 'Forbidden: You can only view your own profile.' });
        }

        res.json(employee);
    } catch (error) {
        console.error('Get employee by ID error:', error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Employee not found (Invalid ID format).' });
        }
        res.status(500).json({ message: 'Server error fetching employee.', error: error.message });
    }
};

// @desc    Update an employee
// @route   PUT /api/employees/:id
// @access  Private (HRManager, EmployeeAdmin, CompanyAdmin)
const updateEmployee = async (req, res) => {
    const {
        firstName, lastName, surname, phoneNo, personalEmail, dob, gender,
        kraPin, nhifNo, nssfNo, bankName, accountNo, maritalStatus, incomeGradeId,
        nextOfKin, departmentId, employmentStartDate, workStatus,
        // userEmail, userRole, userIsActive // For updating associated user login if needed
    } = req.body;

    try {
        const employee = await Employee.findOne({ _id: req.params.id, companyId: req.user.companyId });

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found or not part of your company.' });
        }

        // Update fields
        if (firstName) employee.firstName = firstName;
        if (lastName) employee.lastName = lastName;
        if (surname) employee.surname = surname;
        // ... update all other allowed fields
        employee.phoneNo = phoneNo;
        employee.personalEmail = personalEmail;
        employee.dob = dob;
        employee.gender = gender;
        employee.kraPin = kraPin;
        employee.nhifNo = nhifNo;
        employee.nssfNo = nssfNo;
        employee.bankName = bankName;
        employee.accountNo = accountNo;
        employee.maritalStatus = maritalStatus;
        if (incomeGradeId) {
             const incomeGrade = await IncomeGrade.findOne({ _id: incomeGradeId, companyId: req.user.companyId });
             if (!incomeGrade) return res.status(400).json({ message: 'Income grade not found or does not belong to this company.' });
             employee.incomeGradeId = incomeGradeId;
        }
        if (departmentId) {
            const department = await Department.findOne({ _id: departmentId, companyId: req.user.companyId });
            if (!department) return res.status(400).json({ message: 'Department not found or does not belong to this company.' });
            employee.departmentId = departmentId;
        }
        if (nextOfKin) employee.nextOfKin = nextOfKin;
        if (employmentStartDate) employee.employmentStartDate = employmentStartDate;
        if (workStatus) employee.workStatus = workStatus;


        // Handle associated user account update (more complex, may need separate endpoint or careful logic)
        // For instance, if personalEmail is linked to user login email & it changes.
        // Or if user account needs to be activated/deactivated with workStatus.

        const updatedEmployee = await employee.save();
        res.json(updatedEmployee);

    } catch (error) {
        console.error('Update employee error:', error);
         if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            return res.status(400).json({ message: `Duplicate value for ${field}: ${error.keyValue[field]}.` });
        }
        res.status(500).json({ message: 'Server error updating employee.', error: error.message });
    }
};

// @desc    Deactivate an employee (soft delete)
// @route   DELETE /api/employees/:id
// @access  Private (HRManager, EmployeeAdmin, CompanyAdmin)
const deactivateEmployee = async (req, res) => {
    try {
        const employee = await Employee.findOne({ _id: req.params.id, companyId: req.user.companyId });

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found or not part of your company.' });
        }

        employee.workStatus = 'INACTIVE'; // Or 'TERMINATED'
        // Also deactivate associated user account if it exists
        if (employee.userId) {
            await User.findByIdAndUpdate(employee.userId, { isActive: false });
        }

        await employee.save();
        res.json({ message: 'Employee deactivated successfully.' });

    } catch (error) {
        console.error('Deactivate employee error:', error);
        res.status(500).json({ message: 'Server error deactivating employee.', error: error.message });
    }
};


module.exports = {
    createEmployee,
    getEmployees,
    getEmployeeById,
    updateEmployee,
    deactivateEmployee
};
