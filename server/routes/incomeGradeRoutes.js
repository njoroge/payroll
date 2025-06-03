const express = require('express');
const router = express.Router();
const {
    createIncomeGrade,
    getIncomeGrades,
    getIncomeGradeById,
    updateIncomeGrade,
    deleteIncomeGrade,
} = require('../controllers/incomeGradeController');
const { protect, hasRole } = require('../middleware/authMiddleware');

const adminHRAccess = hasRole(['company_admin', 'employee_admin', 'hr_manager']);

router.use(protect); // Protect all income grade routes

router.route('/')
    .post(adminHRAccess, createIncomeGrade)
    .get(adminHRAccess, getIncomeGrades);

router.route('/:id')
    .get(adminHRAccess, getIncomeGradeById)
    .put(adminHRAccess, updateIncomeGrade)
    .delete(adminHRAccess, deleteIncomeGrade);

module.exports = router;
