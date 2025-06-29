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
// @access  Private (e.g., Admin, Company Owner, company_admin)
router.get('/connect', protect, hasRole(['ADMIN', 'SUPERADMIN', 'COMPANY_OWNER', 'company_admin']), quickbooksController.connectToQuickbooks);

// @desc    Handle QuickBooks OAuth 2.0 callback
// @route   GET /api/quickbooks/callback
// @access  Private (but initiated by redirect, so user context might need careful handling or rely on state)
//          Protect middleware might run if session is maintained, otherwise state validation is key.
//          Adding 'company_admin' for consistency, though primary validation is state and user's companyId match.
router.get('/callback', protect, hasRole(['ADMIN', 'SUPERADMIN', 'COMPANY_OWNER', 'company_admin']), quickbooksController.handleQuickbooksCallback); // Protect ensures req.user is populated

// @desc    Get QuickBooks connection status for the company
// @route   GET /api/quickbooks/status
// @access  Private (e.g., Admin, Company Owner, company_admin, Finance Manager)
router.get('/status', protect, hasRole(['ADMIN', 'SUPERADMIN', 'COMPANY_OWNER', 'FINANCE_MANAGER', 'company_admin']), quickbooksController.getQuickbooksConnectionStatus);

// @desc    Disconnect from QuickBooks (revoke tokens)
// @route   POST /api/quickbooks/disconnect
// @access  Private (e.g., Admin, Company Owner, company_admin)
router.post('/disconnect', protect, hasRole(['ADMIN', 'SUPERADMIN', 'COMPANY_OWNER', 'company_admin']), quickbooksController.disconnectFromQuickbooks);

// @desc    Sync specified payroll data to QuickBooks
// @route   POST /api/quickbooks/sync/payroll/:payrollId
// @access  Private (e.g., Admin, Payroll Manager, company_admin)
router.post('/sync/payroll/:payrollId', protect, hasRole(['ADMIN', 'SUPERADMIN', 'PAYROLL_MANAGER', 'company_admin']), quickbooksController.syncPayrollToQuickbooks);


module.exports = router;
