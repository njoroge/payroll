const express = require('express');
const router = express.Router();
const quickbooksController = require('../controllers/quickbooksController');
const { protect, hasRole } = require('../middleware/authMiddleware'); // Changed authorize to hasRole

// All routes in this file should be protected and require a logged-in user
// Further, specific roles might be required for connecting/disconnecting QBO.
// Example: protect middleware checks for valid JWT.
// authorize middleware checks for specific roles like 'ADMIN' or 'COMPANY_OWNER'.

// @desc    Initiate QuickBooks OAuth 2.0 connection
// @route   GET /api/quickbooks/connect
// @access  Private (e.g., Admin, Company Owner)
router.get('/connect', protect, hasRole(['ADMIN', 'SUPERADMIN', 'COMPANY_OWNER']), quickbooksController.connectToQuickbooks);

// @desc    Handle QuickBooks OAuth 2.0 callback
// @route   GET /api/quickbooks/callback
// @access  Private (but initiated by redirect, so user context might need careful handling or rely on state)
//          Protect middleware might run if session is maintained, otherwise state validation is key.
router.get('/callback', protect, quickbooksController.handleQuickbooksCallback); // Protect ensures req.user is populated for state validation

// @desc    Get QuickBooks connection status for the company
// @route   GET /api/quickbooks/status
// @access  Private (e.g., Admin, Company Owner)
router.get('/status', protect, hasRole(['ADMIN', 'SUPERADMIN', 'COMPANY_OWNER', 'FINANCE_MANAGER']), quickbooksController.getQuickbooksConnectionStatus);

// @desc    Disconnect from QuickBooks (revoke tokens)
// @route   POST /api/quickbooks/disconnect
// @access  Private (e.g., Admin, Company Owner)
router.post('/disconnect', protect, hasRole(['ADMIN', 'SUPERADMIN', 'COMPANY_OWNER']), quickbooksController.disconnectFromQuickbooks);

// @desc    Sync specified payroll data to QuickBooks
// @route   POST /api/quickbooks/sync/payroll/:payrollId
// @access  Private (e.g., Admin, Payroll Manager)
router.post('/sync/payroll/:payrollId', protect, hasRole(['ADMIN', 'SUPERADMIN', 'PAYROLL_MANAGER']), quickbooksController.syncPayrollToQuickbooks);


module.exports = router;
