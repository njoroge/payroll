const express = require('express');
const router = express.Router();
const {
    requestLeave,
    getEmployeeLeaves,
    getAllLeaveRequests,
    approveLeave,
    rejectLeave
} = require('../controllers/leaveController');
const { protect, hasRole } = require('../middleware/authMiddleware');

// Employee routes
router.post(
    '/request',
    protect,
    hasRole(['employee', 'hr_manager', 'employee_admin', 'company_admin']), // Allow all logged in users to request leave for themselves
    requestLeave
);
router.get(
    '/my-requests',
    protect,
    hasRole(['employee', 'hr_manager', 'employee_admin', 'company_admin']), // Allow all logged in users to view their own requests
    getEmployeeLeaves
);

// HR/Admin routes
router.get(
    '/all-requests',
    protect,
    hasRole(['hr_manager', 'employee_admin', 'company_admin']),
    getAllLeaveRequests
);
router.put(
    '/:id/approve',
    protect,
    hasRole(['hr_manager', 'employee_admin', 'company_admin']),
    approveLeave
);
router.put(
    '/:id/reject',
    protect,
    hasRole(['hr_manager', 'employee_admin', 'company_admin']),
    rejectLeave
);

module.exports = router;
