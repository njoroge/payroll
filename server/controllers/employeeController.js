const Employee = require('../models/Employee');
const User = require('../models/User');
const Company = require('../models/Company');
const Department = require('../models/Department');
const IncomeGrade = require('../models/IncomeGrade');
const Payroll = require('../models/Payroll');
const Advance = require('../models/Advance'); // Ensure Advance model is imported

// @desc    Create a new employee
// @route   POST /api/employees
// @access  Private (HRManager, EmployeeAdmin, CompanyAdmin)
const createEmployee = async (req, res) => {
    const {
        nationalId, firstName, lastName, surname, phoneNo, personalEmail, dob, gender,
        kraPin, nhifNo, nssfNo, bankName, accountNo, maritalStatus, incomeGradeId,
        nextOfKin, departmentId, employmentStartDate, workStatus,
        userEmail, userPassword, userRole
    } = req.body;
    const companyId = req.user.companyId;
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
            const newUser = new User({ email: userEmail, password: userPassword, role: userRole, companyId: companyId });
            const savedUser = await newUser.save();
            newUserId = savedUser._id;
        }
        const employee = new Employee({
            nationalId, firstName, lastName, surname, phoneNo, personalEmail, dob, gender,
            kraPin, nhifNo, nssfNo, bankName, accountNo, maritalStatus, incomeGradeId,
            nextOfKin, departmentId, employmentStartDate, workStatus,
            companyId, userId: newUserId,
        });
        const savedEmployee = await employee.save();
        if(newUserId){
            await User.findByIdAndUpdate(newUserId, { employeeId: savedEmployee._id });
        }
        res.status(201).json(savedEmployee);
    } catch (error) {
        console.error('Create employee error:', error);
        if (error.code === 11000) {
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
    } = req.body;
    try {
        const employee = await Employee.findOne({ _id: req.params.id, companyId: req.user.companyId });
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found or not part of your company.' });
        }
        if (firstName) employee.firstName = firstName;
        if (lastName) employee.lastName = lastName;
        if (surname) employee.surname = surname;
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
        employee.workStatus = 'INACTIVE';
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

// @desc    Get logged-in user's own employee details
// @route   GET /api/employees/me
// @access  Private (Employee self-access)
const getMyEmployeeDetails = async (req, res) => {
    try {
        if (!req.user.employeeId) {
            return res.status(403).json({ message: 'Forbidden: No employee profile linked to your user account.' });
        }
        const employee = await Employee.findById(req.user.employeeId)
            .populate('departmentId', 'name')
            .populate('incomeGradeId')
            .populate('companyId', 'name');
        if (!employee) {
            return res.status(404).json({ message: 'Employee profile not found.' });
        }
        if (employee.companyId._id.toString() !== req.user.companyId.toString()) {
             return res.status(403).json({ message: 'Forbidden: Employee profile does not match your company affiliation.' });
        }
        res.json(employee);
    } catch (error) {
        console.error('Get my employee details error:', error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Employee not found (Invalid ID format).' });
        }
        res.status(500).json({ message: 'Server error fetching your employee details.', error: error.message });
    }
};

// @desc    Get logged-in user's annual earnings for a specific year
// @route   GET /api/employees/me/annual-earnings?year=YYYY
// @access  Private (Employee self-access)
const getMyAnnualEarnings = async (req, res) => {
    try {
        if (!req.user.employeeId) {
            return res.status(403).json({ message: 'Forbidden: No employee profile linked to your user account.' });
        }
        const employeeId = req.user.employeeId;
        const { year } = req.query;
        if (!year) {
            return res.status(400).json({ message: 'Year query parameter is required.' });
        }
        const targetYear = parseInt(year);
        if (isNaN(targetYear) || targetYear < 1900 || targetYear > 2200) {
            return res.status(400).json({ message: 'Invalid year provided. Please provide a valid year (e.g., 2023).' });
        }
        const payrolls = await Payroll.find({
            employeeId: employeeId,
            companyId: req.user.companyId,
            year: targetYear,
            status: { $in: ['PAID', 'APPROVED'] }
        });
        let totalAnnualGrossEarnings = 0;
        let totalAnnualNetPay = 0;
        payrolls.forEach(payroll => {
            totalAnnualGrossEarnings += payroll.grossPay || 0;
            totalAnnualNetPay += payroll.netPay || 0;
        });
        res.json({
            year: targetYear,
            employeeId: employeeId,
            totalAnnualGrossEarnings,
            totalAnnualNetPay,
            numberOfPaystubsFound: payrolls.length
        });
    } catch (error) {
        console.error('Get my annual earnings error:', error);
        res.status(500).json({ message: 'Server error fetching your annual earnings.', error: error.message });
    }
};

// @desc    Get logged-in user's financial summary (YTD NSSF, PAYE, Gross, Net) for a specific year
// @route   GET /api/employees/me/financial-summary?year=YYYY
// @access  Private (Employee self-access)
const getMyFinancialSummary = async (req, res) => {
    try {
        if (!req.user.employeeId) {
            return res.status(403).json({ message: 'Forbidden: No employee profile linked to your user account.' });
        }
        const employeeId = req.user.employeeId;
        const { year } = req.query;
        if (!year) {
            return res.status(400).json({ message: 'Year query parameter is required.' });
        }
        const targetYear = parseInt(year);
        if (isNaN(targetYear) || targetYear < 1900 || targetYear > 2200) {
            return res.status(400).json({ message: 'Invalid year provided. Please provide a valid year (e.g., 2023).' });
        }
        const payrolls = await Payroll.find({
            employeeId: employeeId,
            companyId: req.user.companyId,
            year: targetYear,
            status: { $in: ['PAID', 'APPROVED'] }
        }).select('nssfDeduction paye grossPay netPay');
        let ytdNSSF = 0;
        let ytdPAYE = 0;
        let ytdGrossEarnings = 0;
        let ytdNetPay = 0;
        payrolls.forEach(payroll => {
            ytdNSSF += payroll.nssfDeduction || 0;
            ytdPAYE += payroll.paye || 0;
            ytdGrossEarnings += payroll.grossPay || 0;
            ytdNetPay += payroll.netPay || 0;
        });
        res.json({
            year: targetYear,
            ytdNSSFContributions: ytdNSSF,
            ytdPAYE: ytdPAYE,
            ytdGrossEarnings: ytdGrossEarnings,
            ytdNetPay: ytdNetPay,
            numberOfPaystubsFound: payrolls.length
        });
    } catch (error) {
        console.error('Get my financial summary error:', error);
        res.status(500).json({ message: 'Server error fetching your financial summary.', error: error.message });
    }
};

// @desc    Get logged-in user's salary advances
// @route   GET /api/employees/me/advances
// @access  Private (Employee self-access)
const getMyAdvances = async (req, res) => {
    try {
        if (!req.user.employeeId) {
            return res.status(403).json({ message: 'Forbidden: No employee profile linked to your user account.' });
        }
        const employeeId = req.user.employeeId;
        const advances = await Advance.find({
            employeeId: employeeId,
            companyId: req.user.companyId,
            status: { $in: ['PENDING', 'APPROVED'] }
        })
        .populate('employeeId', 'firstName lastName nationalId')
        .sort({ dateIssued: -1 });
        res.json({ advances });
    } catch (error) {
        console.error('Get my advances error:', error);
        res.status(500).json({ message: 'Server error fetching your salary advances.', error: error.message });
    }
};

module.exports = {
    createEmployee,
    getEmployees,
    getEmployeeById,
    updateEmployee,
    deactivateEmployee,
    getMyEmployeeDetails,
    getMyAnnualEarnings,
    getMyFinancialSummary,
    getMyAdvances,
    searchEmployees // Added
};

// @desc    Search for employees
// @route   GET /api/employees/search?term=searchTerm
// @access  Private (Authenticated users)
const searchEmployees = async (req, res) => {
    try {
        const { term } = req.query;
        const { id, companyId } = req.user; // Assuming req.user contains logged-in user's ID and companyId

        if (!term || term.trim().length < 2) {
            return res.json([]); // Return empty array if term is too short or missing
        }

        const searchRegex = new RegExp(term, 'i');

        const query = {
            companyId: companyId,
            _id: { $ne: id }, // Exclude the current user from search results
            $or: [
                { firstName: searchRegex },
                { lastName: searchRegex },
                { personalEmail: searchRegex } // If your Employee model has an email field directly
            ]
        };

        // If email is on the User model and Employee has a userId reference
        // You might need a more complex query if email is only on the User model
        // For instance, first find users, then find employees by those user IDs.
        // Or, if employee schema has email directly, the above is fine.
        // For this example, I'll assume Employee schema might have email or you're searching by name.

        const employees = await Employee.find(query)
            .select('_id firstName lastName personalEmail') // Select fields you want to return
            .limit(10); // Limit results for performance

        res.json(employees);

    } catch (error) {
        console.error('Search employees error:', error);
        res.status(500).json({ message: 'Server error searching employees.', error: error.message });
    }
};
