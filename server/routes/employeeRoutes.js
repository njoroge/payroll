const express = require('express');
const router = express.Router();
const {
    createEmployee,
    getEmployees,
    getEmployeeById,
    updateEmployee,
    deactivateEmployee
} = require('../controllers/employeeController');
const { protect, isHrManager, isEmployeeAdmin, isCompanyAdmin, hasRole } = require('../middleware/authMiddleware');

// Apply protect middleware to all employee routes
router.use(protect);

// Only HR, EmployeeAdmin, or CompanyAdmin can create, update, deactivate, or list all employees
router.route('/')
    .post(hasRole(['hr_manager', 'employee_admin', 'company_admin']), createEmployee)
    .get(hasRole(['hr_manager', 'employee_admin', 'company_admin']), getEmployees);

router.route('/:id')
    .get(hasRole(['hr_manager', 'employee_admin', 'company_admin', 'employee']), getEmployeeById) // Employee can view their own
    .put(hasRole(['hr_manager', 'employee_admin', 'company_admin']), updateEmployee)
    .delete(hasRole(['hr_manager', 'employee_admin', 'company_admin']), deactivateEmployee);

module.exports = router;
