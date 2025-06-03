const express = require('express');
const router = express.Router();
const {
    createAdvance, getAdvances, updateAdvanceStatus,
    createDamage, getDamages, updateDamageStatus,
    createReimbursement, getReimbursements, updateReimbursementStatus
} = require('../controllers/payrollOperationsController');
const { protect, hasRole } = require('../middleware/authMiddleware');

const hrAdminAccess = hasRole(['hr_manager', 'employee_admin', 'company_admin']);
const employeeAccess = hasRole(['employee', 'hr_manager', 'employee_admin', 'company_admin']); // For viewing own items or creating requests

router.use(protect);

// Advance Routes
router.route('/advances')
    .post(hrAdminAccess, createAdvance) // Or employeeAccess if employees can request
    .get(hrAdminAccess, getAdvances); // HR/Admins see all, employees might see their own via different route or query param
router.put('/advances/:id/status', hrAdminAccess, updateAdvanceStatus);

// Damage Routes
router.route('/damages')
    .post(hrAdminAccess, createDamage)
    .get(hrAdminAccess, getDamages);
router.put('/damages/:id/status', hrAdminAccess, updateDamageStatus);

// Reimbursement Routes
router.route('/reimbursements')
    .post(hrAdminAccess, createReimbursement) // Or employeeAccess
    .get(hrAdminAccess, getReimbursements);
router.put('/reimbursements/:id/status', hrAdminAccess, updateReimbursementStatus);

// Future: Routes for employees to view their own items
// router.get('/advances/my', employeeAccess, getMyAdvances);

module.exports = router;
