const User = require('../models/User');
const Company = require('../models/Company');
const Employee = require('../models/Employee');
const { generateToken } = require('../utils/tokenUtils');

// @desc    Register a new company and its admin user
// @route   POST /api/auth/company/register
// @access  Public
const registerCompanyAdmin = async (req, res) => {
    const { companyName, companyTaxPin, companyEmail, companyLocation, companyPhone, adminEmail, adminPassword } = req.body;

    if (!companyName || !companyTaxPin || !companyEmail || !adminEmail || !adminPassword) {
        return res.status(400).json({ message: 'Please provide all required fields for company and admin registration.' });
    }

    try {
        const companyExists = await Company.findOne({ taxPin: companyTaxPin });
        if (companyExists) {
            return res.status(400).json({ message: 'Company with this tax PIN already exists.' });
        }

        const adminUserExists = await User.findOne({ email: adminEmail });
        if (adminUserExists) {
            return res.status(400).json({ message: 'Admin user with this email already exists.' });
        }

        const newCompany = new Company({
            name: companyName,
            taxPin: companyTaxPin,
            companyEmail: companyEmail,
            location: companyLocation,
            phone: companyPhone,
        });
        const savedCompany = await newCompany.save();

        const newAdminUser = new User({
            email: adminEmail,
            password: adminPassword,
            role: 'company_admin',
            companyId: savedCompany._id,
        });
        const savedAdminUser = await newAdminUser.save();

        // Link admin user to company
        savedCompany.adminUserId = savedAdminUser._id;
        await savedCompany.save();

        res.status(201).json({
            message: 'Company and admin registered successfully.',
            company: {
                _id: savedCompany._id,
                name: savedCompany.name,
                taxPin: savedCompany.taxPin,
                companyEmail: savedCompany.companyEmail
            },
            adminUser: {
                _id: savedAdminUser._id,
                email: savedAdminUser.email,
                role: savedAdminUser.role,
            },
            token: generateToken(savedAdminUser._id, savedAdminUser.role),
        });

    } catch (error) {
        console.error('Company registration error:', error);
        // TODO: Add cleanup logic if one part fails (e.g., company created but user fails)
        res.status(500).json({ message: 'Server error during company registration.', error: error.message });
    }
};

// @desc    Authenticate company admin or other users & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password.' });
    }

    try {
        const user = await User.findOne({ email });

        if (user && (await user.comparePassword(password))) {
            if (!user.isActive) {
                return res.status(403).json({ message: 'Account is deactivated.' });
            }

            let companyDetails = null;
            if (user.companyId) {
                companyDetails = await Company.findById(user.companyId).select('name taxPin _id');
            }

            let employeeDetails = null;
            if (user.employeeId) {
                employeeDetails = await Employee.findById(user.employeeId).select('firstName lastName _id');
            }

            res.json({
                _id: user._id,
                email: user.email,
                role: user.role,
                company: companyDetails,
                employee: employeeDetails,
                token: generateToken(user._id, user.role),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password.' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login.', error: error.message });
    }
};

// @desc    Get current logged in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    // req.user is set by the protect middleware
    if (!req.user) {
        return res.status(404).json({ message: 'User not found' });
    }

    let companyDetails = null;
    if (req.user.companyId) {
        companyDetails = await Company.findById(req.user.companyId).select('name taxPin _id');
    }

    let employeeDetails = null;
    if (req.user.employeeId) {
        employeeDetails = await Employee.findById(req.user.employeeId).select('firstName lastName _id nationalId');
    }

    res.json({
        _id: req.user._id,
        email: req.user.email,
        role: req.user.role,
        isActive: req.user.isActive,
        company: companyDetails,
        employee: employeeDetails,
        createdAt: req.user.createdAt
    });
};


module.exports = {
    registerCompanyAdmin,
    loginUser,
    getMe,
    changePassword // Added changePassword to exports
};

// @desc    Change user password
// @route   POST /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Please provide current and new passwords.' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
    }

    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            // This should not happen if protect middleware is effective
            return res.status(404).json({ message: 'User not found.' });
        }

        const isMatch = await user.comparePassword(currentPassword);

        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect current password.' });
        }

        user.password = newPassword; // The pre-save hook in User model will hash this
        await user.save();

        res.json({ message: 'Password updated successfully.' });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Server error during password change.', error: error.message });
    }
};
