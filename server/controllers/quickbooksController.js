const quickbooksService = require('../services/quickbooksService');
const QuickbooksToken = require('../models/QuickbooksToken');

/**
 * Initiates the OAuth 2.0 connection to QuickBooks.
 * Redirects the user to the QuickBooks authorization URL.
 */
exports.connectToQuickbooks = (req, res) => {
    try {
        // Ensure user is authenticated and has a companyId
        if (!req.user || !req.user.companyId) {
            return res.status(401).json({ message: 'User not authenticated or no company associated.' });
        }
        // It's crucial to pass our internal companyId to QBO's state parameter
        // so we can identify the company during the callback.
        const companyId = req.user.companyId.toString();
        const state = `companyId:${companyId}`; // Simple state encoding

        const authUri = quickbooksService.getAuthorizationUri(state);
        res.redirect(authUri);
    } catch (error) {
        console.error('Error initiating QuickBooks connection:', error);
        res.status(500).json({ message: 'Failed to initiate QuickBooks connection.', error: error.message });
    }
};

/**
 * Handles the callback from QuickBooks after user authorization.
 * Exchanges the authorization code for tokens and stores them.
 */
exports.handleQuickbooksCallback = async (req, res) => {
    try {
        const { code, realmId, state } = req.query;

        if (!code || !realmId) {
            return res.status(400).json({ message: 'Missing authorization code or realmId from QuickBooks.' });
        }

        // Extract companyId from state
        let companyInternalId;
        if (state && state.startsWith('companyId:')) {
            companyInternalId = state.split(':')[1];
        }

        if (!companyInternalId) {
            // This is a critical issue, as we can't associate the QBO connection.
            // Log this error and inform the user.
            console.error('Critical: companyId missing from state in QuickBooks callback.');
            return res.status(400).json({ message: 'Company identification failed during QuickBooks callback. Please try connecting again.' });
        }

        // Ensure the user performing this action matches the company in state, or is an admin for that company
        if (!req.user || req.user.companyId.toString() !== companyInternalId) {
             // Add role check if admins can connect for other companies
            if (req.user.role !== 'SUPERADMIN' && req.user.role !== 'ADMIN') { // Example roles
                 return res.status(403).json({ message: 'User not authorized to connect QuickBooks for this company.' });
            }
        }


        await quickbooksService.exchangeCodeForTokens(code, realmId, companyInternalId);

        // Redirect user to a page indicating successful connection
        const clientAppUrl = process.env.CLIENT_APP_URL || 'http://localhost:5173'; // Default for local dev
        const successRedirectUrl = `${clientAppUrl}/integrations/quickbooks?qbo_action=callback&qbo_status=success`;
        console.log(`Redirecting to: ${successRedirectUrl}`);
        res.redirect(successRedirectUrl);

    } catch (error) {
        console.error('Error handling QuickBooks callback:', error);
        const clientAppUrl = process.env.CLIENT_APP_URL || 'http://localhost:5173';
        // It's important to check the type of error. If it's a known issue like "company identification failed",
        // we might want a more specific message.
        let errorMessage = 'Failed to handle QuickBooks callback.';
        if (error.message && error.message.includes('Company identification failed')) {
            errorMessage = error.message;
        } else if (error.message && error.message.includes('User not authorized')) {
            errorMessage = error.message;
        }
        // Consider logging the full error for internal review but only sending a user-friendly message.
        const errorRedirectUrl = `${clientAppUrl}/integrations/quickbooks?qbo_action=callback&qbo_status=error&qbo_message=${encodeURIComponent(errorMessage)}`;
        console.log(`Redirecting to: ${errorRedirectUrl}`);
        res.redirect(errorRedirectUrl);
    }
};

/**
 * Checks the connection status to QuickBooks for the user's company.
 */
exports.getQuickbooksConnectionStatus = async (req, res) => {
    try {
        if (!req.user || !req.user.companyId) {
            return res.status(401).json({ message: 'User not authenticated or no company associated.' });
        }
        const companyId = req.user.companyId;
        const token = await QuickbooksToken.findOne({ companyId });

        if (token && token.accessToken && token.realmId) {
            // Further check if token is valid or refreshable by trying to get a qbo client
            try {
                const qbo = await quickbooksService.getQboClientForCompany(companyId);
                if (qbo) {
                    // Optionally, make a simple API call to verify connection, e.g., qbo.getCompanyInfo()
                    // For now, successfully getting a qbo client instance means tokens are likely fine (or were refreshed)
                    return res.status(200).json({
                        isConnected: true,
                        realmId: token.realmId,
                        connectedAt: token.createdAt,
                        lastRefreshedAt: token.lastRefreshedAt // This comes from the stored token, not necessarily the moment of refresh
                    });
                }
                // This part might be unreachable if getQboClientForCompany always throws on failure or returns null only if no token initially.
                // If getQboClientForCompany returns null (e.g., token was deleted by refreshAccessToken due to invalid_grant, and then re-fetched as null),
                // it would fall through to the isConnected: false at the end.
            } catch (qboClientError) {
                console.warn(`QBO client acquisition failed for company ${companyId}: ${qboClientError.message}`);
                // Check if the error message indicates re-authentication is needed (propagated from refreshAccessToken)
                if (qboClientError.message && qboClientError.message.includes('Please re-authorize')) {
                    return res.status(200).json({
                        isConnected: false,
                        message: qboClientError.message, // Use the specific error message
                        needsReAuth: true
                    });
                }
                // For other errors during client acquisition
                return res.status(200).json({
                    isConnected: false,
                    message: `Failed to connect to QuickBooks: ${qboClientError.message}`,
                    needsReAuth: true // Default to true, as most client acquisition issues might need re-auth or config fix
                });
            }
        }

        // Default if no token record found initially
        return res.status(200).json({ isConnected: false, message: "No QuickBooks connection found." });

    } catch (error) {
        console.error('Error getting QuickBooks connection status:', error);
        res.status(500).json({ message: 'Failed to get QuickBooks connection status.', error: error.message });
    }
};

/**
 * Disconnects from QuickBooks by revoking tokens and deleting local records.
 */
exports.disconnectFromQuickbooks = async (req, res) => {
    try {
        if (!req.user || !req.user.companyId) {
            return res.status(401).json({ message: 'User not authenticated or no company associated.' });
        }
        const companyId = req.user.companyId;

        await quickbooksService.revokeTokens(companyId);
        res.status(200).json({ message: 'Successfully disconnected from QuickBooks.' });

    } catch (error) {
        console.error('Error disconnecting from QuickBooks:', error);
        res.status(500).json({ message: 'Failed to disconnect from QuickBooks.', error: error.message });
    }
};

const Payroll = require('../models/Payroll'); // Import Payroll model
const Employee = require('../models/Employee'); // Import Employee model for populating details

// Placeholder for sync functionality - to be implemented in a later step
exports.syncPayrollToQuickbooks = async (req, res) => {
    try {
        if (!req.user || !req.user.companyId) {
            return res.status(401).json({ message: 'User not authenticated or no company associated.' });
        }
        const companyId = req.user.companyId;
        const { payrollId } = req.params;

        if (!payrollId) {
            return res.status(400).json({ message: 'Payroll ID is required.' });
        }

        // 1. Fetch payroll data
        // Ensure to populate necessary fields, especially employee details for the JE note
        const payrollData = await Payroll.findById(payrollId)
            .populate({
                path: 'employeeId',
                select: 'firstName lastName employeeCode' // Select fields needed for the note
            });

        if (!payrollData) {
            return res.status(404).json({ message: 'Payroll record not found.' });
        }
        if (payrollData.companyId.toString() !== companyId.toString()) {
            return res.status(403).json({ message: 'User not authorized to sync this payroll record.' });
        }
        // Optional: Check payroll status, e.g., only sync 'APPROVED' or 'PAID' payrolls
        if (payrollData.status !== 'APPROVED' && payrollData.status !== 'PAID') {
            // This status check depends on the workflow. Some might sync PENDING_APPROVAL for review in QBO.
            // For now, let's assume it should be at least approved.
             console.warn(`Payroll ${payrollId} is in status ${payrollData.status}. Syncing anyway, but consider status checks.`);
            // return res.status(400).json({ message: `Payroll must be in APPROVED or PAID status to sync. Current status: ${payrollData.status}` });
        }


        // 2. Call the service to create and post the Journal Entry
        // The service method getQboClientForCompany is called internally by createPayrollJournalEntry
        const journalEntryResponse = await quickbooksService.createPayrollJournalEntry(companyId, payrollData);

        // 3. Update payroll record with sync status (optional but recommended)
        payrollData.quickbooksSyncStatus = 'SYNCED';
        payrollData.quickbooksJournalEntryId = journalEntryResponse.Id; // Assuming QBO response has an Id
        payrollData.quickbooksLastSyncAt = new Date();
        await payrollData.save();

        res.status(200).json({
            message: 'Payroll data successfully synced to QuickBooks.',
            journalEntryId: journalEntryResponse.Id,
            details: journalEntryResponse
        });

    } catch (error) {
        console.error('Error syncing payroll to QuickBooks:', error.message); // Log the message for clarity
        // Check if the error is from QBO account lookup (e.g., account not found)
        if (error.message && error.message.includes("not found in your QuickBooks Chart of Accounts")) {
             return res.status(400).json({
                message: 'Failed to sync payroll to QuickBooks due to account configuration issue.',
                error: error.message, // This will now contain the specific account name that was not found
                details: "Please ensure all necessary accounts (as listed in QUICKBOOKS_INTEGRATION.md, e.g., 'Salaries and Wages Expense', 'Payroll Liabilities - PAYE', etc.) exist in your QuickBooks Chart of Accounts and are active."
            });
        } else if (error.message && error.message.includes("QuickBooks API error while searching for account")) {
            return res.status(502).json({ // Bad Gateway might be appropriate for upstream API errors
                message: 'Failed to sync payroll to QuickBooks due to an issue communicating with QuickBooks.',
                error: error.message,
                details: "There was a problem searching for an account in QuickBooks. Please try again later. If the issue persists, check QuickBooks API status or your connection."
            });
        }
        // Default error for other sync issues
        res.status(500).json({
            message: 'An unexpected error occurred while syncing payroll to QuickBooks.',
            error: error.message,
            details: error.stack // For debugging, remove or reduce in production
        });
    }
};
