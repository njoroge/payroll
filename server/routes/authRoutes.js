const express = require('express');
const router = express.Router();
const { registerCompanyAdmin, loginUser, getMe, changePassword } = require('../controllers/authController'); // Added changePassword
const { protect } = require('../middleware/authMiddleware');

router.post('/company/register', registerCompanyAdmin);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.post('/change-password', protect, changePassword); // Added change password route
// Employee registration will be handled by an admin/HR, so it will be in userRoutes or employeeRoutes

module.exports = router;
