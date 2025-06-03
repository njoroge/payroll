const express = require('express');
const router = express.Router();
const {
    runPayroll,
    getPayrolls,
    getPayslipById,
    updatePayslipStatus,
    updatePayrollSettings
} = require('../controllers/payrollController');
const { protect, hasRole, isCompanyAdmin } = require('../middleware/authMiddleware');

const hrAdminAccess = hasRole(['hr_manager', 'employee_admin', 'company_admin']);

router.use(protect);

router.post('/run', hrAdminAccess, runPayroll);
router.get('/', hrAdminAccess, getPayrolls); // Admins/HR get list of payrolls

router.post('/settings', isCompanyAdmin, updatePayrollSettings); // Only Company Admin can change settings

router.route('/:id')
    .get(hasRole(['hr_manager', 'employee_admin', 'company_admin', 'employee']), getPayslipById) // Employee can view own
    .put(hrAdminAccess, updatePayslipStatus); // Update status like 'approve', 'paid'


module.exports = router;
