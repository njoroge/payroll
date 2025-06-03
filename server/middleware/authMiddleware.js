const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Assuming User model path
const dotenv = require('dotenv');

dotenv.config();

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password'); // Attach user to request, exclude password
            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }
            next();
        } catch (error) {
            console.error('Token verification error:', error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const hasRole = (roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Forbidden: You do not have the required role' });
    }
    next();
};

// Specific role middleware
const isCompanyAdmin = hasRole(['company_admin']);
const isEmployeeAdmin = hasRole(['employee_admin', 'company_admin']); // company_admin can also be employee_admin
const isHrManager = hasRole(['hr_manager', 'company_admin', 'employee_admin']);


module.exports = { protect, isCompanyAdmin, isEmployeeAdmin, isHrManager, hasRole };
