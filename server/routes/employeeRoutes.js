const express = require('express');
const router = express.Router();
const {
    createEmployee,
    getEmployees,
    getEmployeeById,
    updateEmployee,
    deactivateEmployee,
    getMyEmployeeDetails,
    getMyAnnualEarnings,
    getMyFinancialSummary,
    getMyAdvances // Added
} = require('../controllers/employeeController');
const { protect, isHrManager, isEmployeeAdmin, isCompanyAdmin, hasRole } = require('../middleware/authMiddleware');

// Apply protect middleware to all employee routes
router.use(protect);

// Route for employee to get their own details
router.get('/me', getMyEmployeeDetails);
router.get('/me/annual-earnings', getMyAnnualEarnings);
router.get('/me/financial-summary', getMyFinancialSummary);
router.get('/me/advances', getMyAdvances); // New route for employee advances

// Only HR, EmployeeAdmin, or CompanyAdmin can create, update, deactivate, or list all employees
router.route('/')
    .post(hasRole(['hr_manager', 'employee_admin', 'company_admin']), createEmployee)
    .get(hasRole(['hr_manager', 'employee_admin', 'company_admin']), getEmployees);

router.route('/:id')
    .get(hasRole(['hr_manager', 'employee_admin', 'company_admin', 'employee']), getEmployeeById) // Employee can view their own
    .put(hasRole(['hr_manager', 'employee_admin', 'company_admin']), updateEmployee)
    .delete(hasRole(['hr_manager', 'employee_admin', 'company_admin']), deactivateEmployee);

module.exports = router;
