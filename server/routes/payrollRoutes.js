const express = require('express');
const router = express.Router();
const {
    runPayroll, // Corrected: removed duplicate
    getPayrolls,
    getPayslipById,
    updatePayslipStatus,
    updatePayrollSettings,
    getUpcomingPaymentDates
} = require('../controllers/payrollController');
const { protect, hasRole, isCompanyAdmin } = require('../middleware/authMiddleware');

const hrAdminAccess = hasRole(['hr_manager', 'employee_admin', 'company_admin']);
const employeeAndAboveAccess = hasRole(['hr_manager', 'employee_admin', 'company_admin', 'employee']);

router.use(protect);

router.post('/run', hrAdminAccess, runPayroll);
router.get('/', employeeAndAboveAccess, getPayrolls); // Admins/HR get list of payrolls, Employee gets their own
router.get('/upcoming-payment-dates', getUpcomingPaymentDates); // protect is already applied by router.use(protect)

router.post('/settings', isCompanyAdmin, updatePayrollSettings); // Only Company Admin can change settings

router.route('/:id')
    .get(hasRole(['hr_manager', 'employee_admin', 'company_admin', 'employee']), getPayslipById) // Employee can view own
    .put(hrAdminAccess, updatePayslipStatus); // Update status like 'approve', 'paid'


module.exports = router;
