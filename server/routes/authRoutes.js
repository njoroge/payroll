const express = require('express');
const router = express.Router();
const { registerCompanyAdmin, loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/company/register', registerCompanyAdmin);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
// Employee registration will be handled by an admin/HR, so it will be in userRoutes or employeeRoutes

module.exports = router;
