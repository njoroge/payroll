const express = require('express');
const router = express.Router();
const { createBank, getBanks, updateBank } = require('../controllers/bankController');
const { protect, isCompanyAdmin } = require('../middleware/authMiddleware'); // Assuming isCompanyAdmin for create/update

router.route('/')
    .post(protect, isCompanyAdmin, createBank) // Only company admin can create banks
    .get(protect, getBanks); // Any authenticated user can get banks (for dropdowns etc)

router.route('/:id')
    .put(protect, isCompanyAdmin, updateBank); // Only company admin can update banks

module.exports = router;
