const express = require('express');
const router = express.Router();
const {
    createDepartment,
    getDepartments,
    getDepartmentById,
    updateDepartment,
    deleteDepartment,
} = require('../controllers/departmentController');
const { protect, hasRole } = require('../middleware/authMiddleware');

router.use(protect); // Protect all department routes

router.route('/')
    .post(hasRole(['company_admin', 'employee_admin']), createDepartment)
    .get(hasRole(['company_admin', 'employee_admin', 'hr_manager']), getDepartments);

router.route('/:id')
    .get(hasRole(['company_admin', 'employee_admin', 'hr_manager']), getDepartmentById)
    .put(hasRole(['company_admin', 'employee_admin']), updateDepartment)
    .delete(hasRole(['company_admin', 'employee_admin']), deleteDepartment);

module.exports = router;
