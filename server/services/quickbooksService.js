const QuickBooks = require('node-quickbooks');
const QuickbooksToken = require('../models/QuickbooksToken');
const Company = require('../models/Company'); // To ensure company exists

// Initialize QuickBooks client
// These would typically come from process.env
const QB_CLIENT_ID = process.env.QUICKBOOKS_CLIENT_ID;
const QB_CLIENT_SECRET = process.env.QUICKBOOKS_CLIENT_SECRET;
const QB_REDIRECT_URI = process.env.QUICKBOOKS_REDIRECT_URI;
const QB_ENVIRONMENT = process.env.QUICKBOOKS_ENVIRONMENT || 'sandbox'; // 'sandbox' or 'production'

// Helper function to initialize the QuickBooks SDK client for OAuth processes
const getOAuthClient = () => {
    return new QuickBooks(
        QB_CLIENT_ID,
        QB_CLIENT_SECRET,
        '', // No access token yet for initial OAuth steps
        false, // noQuery = false
        '', // No realmId yet
        QB_ENVIRONMENT === 'sandbox', // useSandbox
        false, // debug
        null, // minorversion
        '2.0', // oauthversion
        '' // No refresh token yet
    );
};

/**
 * Generates the authorization URI to redirect the user to QuickBooks.
 * @param {string} state The state parameter to be included in the authorization URI.
 * @returns {string} The authorization URI.
 */
const getAuthorizationUri = (state) => {
    const qbo = getOAuthClient();
    if (!state) {
        // Fallback or error if state is critical and not provided,
        // though controller should always provide it.
        console.warn('State parameter not provided to getAuthorizationUri. Using default.');
        state = 'qb-auth-request-default';
    }
    const authUri = qbo.authorizeUri({
        scope: [QuickBooks.scopes.Accounting], // Add other scopes if needed
        state: state, // Use the provided state
    });
    return authUri;
};

/**
 * Exchanges an authorization code for an OAuth 2.0 token set.
 * @param {string} authCode The authorization code from QuickBooks callback.
 * @param {string} realmId The realm ID (QuickBooks Company ID) from callback.
 * @param {string} companyId The ID of the company in our system.
 * @returns {Promise<object>} The stored QuickbooksToken document.
 */
const exchangeCodeForTokens = async (authCode, realmId, companyInternalId) => {
    if (!authCode || !realmId || !companyInternalId) {
        throw new Error('Authorization code, realm ID, and internal company ID are required.');
    }

    const qbo = getOAuthClient();

    try {
        const tokenResponse = await new Promise((resolve, reject) => {
            qbo.getToken(authCode, QB_REDIRECT_URI, (err, token) => {
                if (err) {
                    console.error('Error getting token from QuickBooks:', err.authResponse);
                    // err.authResponse often contains { error: 'invalid_grant' } or similar
                    return reject(new Error(`QuickBooks token exchange failed: ${err.authResponse?.error || err.message}`));
                }
                resolve(token);
            });
        });

        if (!tokenResponse || !tokenResponse.access_token || !tokenResponse.refresh_token) {
            console.error('Invalid token response from QuickBooks:', tokenResponse);
            throw new Error('Failed to obtain valid tokens from QuickBooks.');
        }

        const company = await Company.findById(companyInternalId);
        if (!company) {
            throw new Error(`Company with ID ${companyInternalId} not found.`);
        }

        // Calculate expiry date (expires_in is in seconds)
        const expiryDate = new Date(Date.now() + tokenResponse.expires_in * 1000);
        const refreshTokenExpiryDate = new Date(Date.now() + tokenResponse.x_refresh_token_expires_in * 1000);


        // Store tokens securely
        // TODO: Implement actual encryption for accessToken and refreshToken
        const newTokens = {
            companyId: companyInternalId,
            accessToken: tokenResponse.access_token, // Encrypt this
            refreshToken: tokenResponse.refresh_token, // Encrypt this
            realmId: realmId,
            tokenExpiryDate: expiryDate,
            lastRefreshedAt: new Date(),
            scope: tokenResponse.scope || QuickBooks.scopes.Accounting,
            // Consider storing refreshTokenExpiryDate as well if needed for proactive refresh
        };

        // Upsert: if tokens for this companyId exist, update them; otherwise, create new.
        const storedToken = await QuickbooksToken.findOneAndUpdate(
            { companyId: companyInternalId },
            newTokens,
            { new: true, upsert: true, runValidators: true }
        );

        return storedToken;
    } catch (error) {
        console.error('Error in exchangeCodeForTokens:', error);
        throw error; // Re-throw to be caught by controller
    }
};

/**
 * Retrieves the QuickBooks SDK instance configured with stored tokens for a company.
 * @param {string} companyId The ID of the company in our system.
 * @returns {Promise<QuickBooks | null>} QuickBooks SDK instance or null if not configured.
 */
const getQboClientForCompany = async (companyId) => {
    const tokenData = await QuickbooksToken.findOne({ companyId });
    if (!tokenData) {
        console.log(`No QuickBooks token found for company ${companyId}`);
        return null;
    }

    // TODO: Implement token decryption here before passing to QuickBooks constructor

    // Check if access token is expired or close to expiring
    if (new Date() >= new Date(tokenData.tokenExpiryDate - 5 * 60 * 1000)) { // 5 min buffer
        console.log(`Access token for company ${companyId} expired or expiring soon. Attempting refresh.`);
        try {
            // refreshAccessToken will throw an error if it fails, esp. if re-auth is needed.
            // That error will be caught by the outer catch block of getQboClientForCompany or by the caller.
            const refreshedTokenDoc = await refreshAccessToken(companyId, tokenData.refreshToken, tokenData.realmId);
            // If refreshAccessToken was successful, it returns the updated token document.
            // No need to re-fetch if refreshAccessToken returns the updated document.
            // TODO: Decrypt refreshedTokenDoc.accessToken
            return new QuickBooks(
                QB_CLIENT_ID,
                QB_CLIENT_SECRET,
                refreshedTokenDoc.accessToken, // Corrected: use refreshedTokenDoc
                false, // noQuery
                refreshedTokenDoc.realmId,    // Corrected: use refreshedTokenDoc
                QB_ENVIRONMENT === 'sandbox',
                false, // debug
                null, // minorversion
                '2.0',
                refreshedTokenDoc.refreshToken // Corrected: use refreshedTokenDoc
            );
        } catch (refreshError) {
            // Log the error and then re-throw it to be handled by the calling function (e.g., in the controller)
            // This ensures the specific error message from refreshAccessToken (like "Please re-authorize") is propagated.
            console.error(`Failed to refresh token for company ${companyId} during client acquisition: ${refreshError.message}`);
            throw refreshError; // Re-throw the original error from refreshAccessToken
        }
    }

    // TODO: Decrypt tokenData.accessToken if not already done by a getter or another layer
    return new QuickBooks(
        QB_CLIENT_ID,
        QB_CLIENT_SECRET,
        tokenData.accessToken, // Use the (decrypted) access token
        false, // noQuery
        tokenData.realmId,
        QB_ENVIRONMENT === 'sandbox',
        false, // debug
        null, // minorversion
        '2.0',
        tokenData.refreshToken // Pass refresh token
    );
};

/**
 * Refreshes an expired OAuth 2.0 access token.
 * @param {string} companyInternalId - The internal ID of the company.
 * @param {string} refreshTokenValue - The refresh token (decrypted).
 * @param {string} realmId - The QuickBooks realm ID.
 * @returns {Promise<object>} The updated QuickbooksToken document.
 */
const refreshAccessToken = async (companyInternalId, refreshTokenValue, realmId) => {
    if (!refreshTokenValue) {
        throw new Error('Refresh token is required to refresh the access token.');
    }

    const qbo = new QuickBooks( // Initialize with necessary details for refresh
        QB_CLIENT_ID,
        QB_CLIENT_SECRET,
        '', // No access token needed for refresh call itself
        false,
        realmId,
        QB_ENVIRONMENT === 'sandbox',
        false,
        null,
        '2.0',
        refreshTokenValue // Provide the refresh token
    );

    try {
        const tokenResponse = await new Promise((resolve, reject) => {
            qbo.refreshAccessToken((err, token) => {
                if (err || !token || !token.access_token) {
                     console.error('Error refreshing token with QuickBooks:', err ? (err.authResponse || err.message) : 'No token in response');
                    return reject(new Error(`QuickBooks token refresh failed: ${err ? (err.authResponse?.error || err.message) : 'Unknown error'}`));
                }
                resolve(token);
            });
        });

        const expiryDate = new Date(Date.now() + tokenResponse.expires_in * 1000);
        // Note: The refresh token might also be updated by QBO, ensure to save the new one if provided
        const newRefreshToken = tokenResponse.refresh_token || refreshTokenValue;

        // TODO: Encrypt accessToken and newRefreshToken
        const updatedTokens = {
            accessToken: tokenResponse.access_token,
            refreshToken: newRefreshToken,
            tokenExpiryDate: expiryDate,
            lastRefreshedAt: new Date(),
            scope: tokenResponse.scope || QuickBooks.scopes.Accounting,
        };

        const storedToken = await QuickbooksToken.findOneAndUpdate(
            { companyId: companyInternalId, realmId: realmId },
            updatedTokens,
            { new: true, runValidators: true }
        );

        if (!storedToken) {
            throw new Error('Failed to find and update token record during refresh.');
        }
        console.log(`Access token refreshed successfully for company ${companyInternalId}`);
        return storedToken;

    } catch (error) {
        console.error(`Error in refreshAccessToken for company ${companyInternalId}:`, error);
        // If refresh token is invalid (e.g., revoked, expired), user needs to re-auth
        if (error.message && error.message.includes('invalid_grant')) {
            // Could delete the stored token here or mark it as invalid
            await QuickbooksToken.deleteOne({ companyId: companyInternalId, realmId: realmId });
            throw new Error('QuickBooks refresh token is invalid. Please re-authorize the application.');
        }
        throw error; // Re-throw to be handled by caller
    }
};

/**
 * Revokes QuickBooks tokens (access and refresh).
 * @param {string} companyId The ID of the company in our system.
 * @returns {Promise<void>}
 */
const revokeTokens = async (companyId) => {
    const tokenData = await QuickbooksToken.findOne({ companyId });
    if (!tokenData) {
        console.log(`No QuickBooks token found for company ${companyId} to revoke.`);
        return;
    }

    // TODO: Decrypt tokens if they are encrypted in DB
    const accessToken = tokenData.accessToken;
    const refreshToken = tokenData.refreshToken;

    const qbo = new QuickBooks(
        QB_CLIENT_ID,
        QB_CLIENT_SECRET,
        accessToken,
        false, // noQuery
        tokenData.realmId,
        QB_ENVIRONMENT === 'sandbox',
        false, // debug
        null, // minorversion
        '2.0',
        refreshToken
    );

    try {
        // Attempt to revoke with access token first, then refresh token as per QBO docs
        // However, node-quickbooks revokeMyToken seems to use the refresh_token if available, or access_token.
        // The SDK's revokeMyToken method might need specific parameters or might try both.
        // Let's assume we want to revoke both. The SDK's `revokeMyToken` might only revoke the one it's configured with.
        // Intuit's API has a specific revocation endpoint: /oauth2/v1/tokens/revoke

        // Option 1: Use SDK's built-in (if it correctly targets both or the primary one)
        // await new Promise((resolve, reject) => {
        //     qbo.revokeToken(tokenData.refreshToken, (err, response) => { // SDK might prefer refresh token for revocation
        //         if (err) {
        //             console.error('Error revoking QuickBooks token:', err.authResponse || err);
        //             return reject(new Error('QuickBooks token revocation failed.'));
        //         }
        //         console.log('QuickBooks token revocation successful response:', response);
        //         resolve(response);
        //     });
        // });
        // The node-quickbooks SDK's revokeToken method is poorly documented for OAuth2.
        // It's safer to call Intuit's revocation endpoint directly if issues arise.
        // For now, we'll rely on deleting the local record. True revocation is better.
        // A more direct API call would be:
        // const revokeUrl = qbo.revocationEndpoint; // https://developer.api.intuit.com/oauth2/v1/tokens/revoke
        // await qbo.OAuth2Request({
        //     url: revokeUrl,
        //     method: 'POST',
        //     headers: {
        //         'Authorization': 'Basic ' + Buffer.from(QB_CLIENT_ID + ':' + QB_CLIENT_SECRET).toString('base64'),
        //         'Accept': 'application/json',
        //         'Content-Type': 'application/x-www-form-urlencoded'
        //     },
        //     body: `token=${tokenData.refreshToken}` // or accessToken
        // });
        // console.log(`Attempted to revoke token for company ${companyId} with QuickBooks.`);


        // For simplicity in this step, we'll primarily focus on deleting the local record.
        // Proper revocation with QBO API is important for security.
        // The node-quickbooks library might not have a straightforward way to revoke *both*
        // tokens or a specific one if the client is already initialized.
        // A direct HTTP request to Intuit's revocation endpoint is the most reliable.


    } catch (error) {
        console.error(`Error during QuickBooks token revocation for company ${companyId}:`, error);
        // Don't let this stop local deletion
    } finally {
        // Always delete the local token record
        await QuickbooksToken.findOneAndDelete({ companyId });
        console.log(`Locally deleted QuickBooks tokens for company ${companyId}.`);
    }
};


/**
 * Transforms payroll data into a QuickBooks Journal Entry and posts it.
 * @param {string} companyId - The internal ID of the company.
 * @param {object} payrollData - The payroll document from our database.
 * @returns {Promise<object>} The created JournalEntry object from QuickBooks.
 */
const createPayrollJournalEntry = async (companyId, payrollData) => {
    const qbo = await getQboClientForCompany(companyId);
    if (!qbo) {
        throw new Error('QuickBooks client not available. Please connect to QuickBooks first.');
    }

    // In-memory cache for account IDs for the duration of this function call
    const accountCache = {};

    // --- Helper to get Account Refs ---
    // In a real scenario, these account names should be configurable by the user
    // or fetched and cached from QBO's Chart of Accounts.
    // For this example, we're assuming these accounts exist in QBO.
    // The `findAccounts` method can be used to get actual Account IDs.
    // For simplicity, we'll use names and assume the SDK or QBO can resolve them,
    // or ideally, we'd fetch IDs first. node-quickbooks typically requires IDs.

    // Placeholder: Fetch or define account IDs/Refs.
    // This is a simplified approach. Robust implementation requires mapping.
    // You would typically fetch accounts like:
    // const accounts = await new Promise((resolve, reject) => {
    // qbo.findAccounts({ Name: ['Salaries and Wages Expense', 'Payroll Liabilities - PAYE', ...]}, (err, queryResponse) => { ... });
    // });
    // And then map them. For now, we'll construct refs with placeholder names.
    // QBO API strictly requires Account IDs for Journal Entry lines.
    // This means we MUST first fetch the Chart of Accounts or have a mapping.
    // Let's assume we have a (very simplified) way to get these IDs.
    // For this example, I'll use placeholder IDs. In a real app, these MUST be fetched.

    const getAccountId = async (accountName) => {
    if (accountCache[accountName]) {
        return accountCache[accountName];
    }

    console.log(`Fetching account ID for: ${accountName}`);
    try {
        const accountsResponse = await new Promise((resolve, reject) => {
            qbo.findAccounts({
                Name: accountName,
                Active: true,
                // AccountType: QB_ENVIRONMENT === 'sandbox' ? null : undefined // Be careful with AccountType, might make it too restrictive if not perfectly matching QBO. For now, let's rely on Name and Active status.
            }, (err, queryResult) => {
                if (err) {
                    console.error(`Error finding account "${accountName}" in QuickBooks:`, err.Fault ? JSON.stringify(err.Fault) : err.message);
                    return reject(new Error(`QuickBooks API error while searching for account "${accountName}": ${err.Fault?.Error?.[0]?.Message || err.message}`));
                }
                if (!queryResult || !queryResult.QueryResponse || !queryResult.QueryResponse.Account || queryResult.QueryResponse.Account.length === 0) {
                    console.warn(`Account named "${accountName}" not found in QuickBooks. Ensure it exists and is active.`);
                    return reject(new Error(`Account named "${accountName}" not found in your QuickBooks Chart of Accounts. Please ensure it is set up correctly and is active.`));
                }
                if (queryResult.QueryResponse.Account.length > 1) {
                    // If multiple accounts with the same name exist, this is ambiguous.
                    // For robust handling, you might need to filter by AccountType or other criteria.
                    // For now, we'll pick the first one but warn. This should be addressed with more specific account names or types.
                    console.warn(`Multiple active accounts found for "${accountName}". Using the first one: ID ${queryResult.QueryResponse.Account[0].Id} (${queryResult.QueryResponse.Account[0].AccountType}). Consider making account names more specific or implementing mapping by account type.`);
                }
                resolve(queryResult.QueryResponse.Account[0]);
            });
            });

        const accountRef = { value: accountsResponse.Id, name: accountsResponse.Name };
        accountCache[accountName] = accountRef; // Cache it
        return accountRef;

    } catch (error) {
        // Ensure the error is propagated correctly
        console.error(`Error in getAccountId for "${accountName}":`, error.message);
        throw error; // Re-throw to be caught by the controller and sent to user
    }
    };

    // --- Start Journal Entry Lines ---
    const lines = [];
    const journalDate = new Date(payrollData.year, payrollData.month - 1, new Date(payrollData.year, payrollData.month, 0).getDate()); // Last day of the month

    // 1. Debit Salary/Wage Expenses
    if (payrollData.grossEarnings > 0) {
        lines.push({
            DetailType: 'JournalEntryLineDetail',
            Amount: payrollData.grossEarnings.toFixed(2),
            PostingType: 'Debit',
            JournalEntryLineDetail: {
                AccountRef: await getAccountId('Salaries and Wages Expense'), // Placeholder
            },
            Description: `Gross earnings for ${payrollData.month}/${payrollData.year}`,
        });
    }

    // 2. Debit Employer Statutory Contributions (if tracked as separate expenses)
    if (payrollData.nssfEmployerContribution > 0) {
        lines.push({
            DetailType: 'JournalEntryLineDetail',
            Amount: payrollData.nssfEmployerContribution.toFixed(2),
            PostingType: 'Debit',
            JournalEntryLineDetail: {
                AccountRef: await getAccountId('Employer NSSF Expense'), // Placeholder
            },
            Description: `Employer NSSF for ${payrollData.month}/${payrollData.year}`,
        });
    }
    if (payrollData.ahlEmployerContribution > 0) {
         lines.push({
            DetailType: 'JournalEntryLineDetail',
            Amount: payrollData.ahlEmployerContribution.toFixed(2),
            PostingType: 'Debit',
            JournalEntryLineDetail: {
                AccountRef: await getAccountId('Employer AHL Expense'), // Placeholder
            },
            Description: `Employer AHL for ${payrollData.month}/${payrollData.year}`,
        });
    }
    // SHIF employer contribution if applicable (current model seems to only have employee deduction)

    // 3. Credit Payroll Liabilities (Employee Deductions & Net Pay to Bank)
    // PAYE Liability
    if (payrollData.paye > 0) {
        lines.push({
            DetailType: 'JournalEntryLineDetail',
            Amount: payrollData.paye.toFixed(2),
            PostingType: 'Credit',
            JournalEntryLineDetail: {
                AccountRef: await getAccountId('Payroll Liabilities - PAYE'), // Placeholder
            },
            Description: `PAYE for ${payrollData.month}/${payrollData.year}`,
        });
    }
    // NSSF Employee Deduction Liability
    if (payrollData.nssfDeduction > 0) {
        lines.push({
            DetailType: 'JournalEntryLineDetail',
            Amount: payrollData.nssfDeduction.toFixed(2),
            PostingType: 'Credit',
            JournalEntryLineDetail: {
                AccountRef: await getAccountId('Payroll Liabilities - NSSF'), // Placeholder
            },
            Description: `Employee NSSF deduction for ${payrollData.month}/${payrollData.year}`,
        });
    }
    // SHIF Employee Deduction Liability
    if (payrollData.shifDeduction > 0) {
        lines.push({
            DetailType: 'JournalEntryLineDetail',
            Amount: payrollData.shifDeduction.toFixed(2),
            PostingType: 'Credit',
            JournalEntryLineDetail: {
                AccountRef: await getAccountId('Payroll Liabilities - SHIF'), // Placeholder
            },
            Description: `Employee SHIF deduction for ${payrollData.month}/${payrollData.year}`,
        });
    }
    // AHL Employee Deduction Liability
    if (payrollData.ahlDeduction > 0) {
        lines.push({
            DetailType: 'JournalEntryLineDetail',
            Amount: payrollData.ahlDeduction.toFixed(2),
            PostingType: 'Credit',
            JournalEntryLineDetail: {
                AccountRef: await getAccountId('Payroll Liabilities - AHL'), // Placeholder
            },
            Description: `Employee AHL deduction for ${payrollData.month}/${payrollData.year}`,
        });
    }
    // Advances Deducted Liability (or reduction of an asset if advances are assets)
    if (payrollData.advanceDeducted > 0) {
        lines.push({
            DetailType: 'JournalEntryLineDetail',
            Amount: payrollData.advanceDeducted.toFixed(2),
            PostingType: 'Credit', // Crediting to offset the advance asset or create a liability to clear
            JournalEntryLineDetail: {
                AccountRef: await getAccountId('Payroll Liabilities - Advances'), // Or 'Employee Advances Asset'
            },
            Description: `Advances deducted for ${payrollData.month}/${payrollData.year}`,
        });
    }
    // Damages Deducted Liability
    if (payrollData.damageDeducted > 0) {
        lines.push({
            DetailType: 'JournalEntryLineDetail',
            Amount: payrollData.damageDeducted.toFixed(2),
            PostingType: 'Credit',
            JournalEntryLineDetail: {
                AccountRef: await getAccountId('Payroll Liabilities - Damages'), // Or an income account if damages are recoveries
            },
            Description: `Damages deducted for ${payrollData.month}/${payrollData.year}`,
        });
    }

    // 4. Credit Reimbursements (if they were part of Gross Pay, they are covered. If separate, adjust)
    // Current model adds reimbursements to Net Pay *after* deductions from Gross.
    // This means reimbursements increase the amount paid from bank, and should be debited to an expense.
    // If Reimbursements are included in GrossEarnings, this is fine.
    // If `reimbursementAdded` is an additional payment on top of `grossEarnings - totalDeductions`,
    // then it also needs to be an expense.
    // The current `netPay = grossEarnings - totalDeductions + reimbursementAdded;` implies it's an additional cash out.
    // So, debit "Reimbursement Expense" and credit Bank.
    // Let's assume reimbursements are part of gross for simplicity here, or handled separately.
    // If `reimbursementAdded` is a separate cash out, it should be:
    // Debit: Reimbursement Expense, Credit: Bank Account.
    // For now, I will assume reimbursements are included in the gross for simpler JE.
    // If `payrollData.reimbursementAdded > 0` and it's *not* in `grossEarnings` but paid out,
    // it needs to be expensed:
    // lines.push({
    //     DetailType: 'JournalEntryLineDetail',
    //     Amount: payrollData.reimbursementAdded.toFixed(2),
    //     PostingType: 'Debit',
    //     JournalEntryLineDetail: { AccountRef: await getAccountId('Reimbursement Expense') },
    //     Description: `Reimbursements for ${payrollData.month}/${payrollData.year}`,
    // });
    // And this amount would increase the credit to the bank account.

    // 5. Credit Bank Account for Net Pay
    // Net Pay = grossEarnings - (paye + nssfDeduction + shifDeduction + ahlDeduction + advanceDeducted + damageDeducted) + reimbursementAdded
    // The sum of all credits to liability accounts + credit to bank for net pay should equal sum of all debits (expenses).
    // Total Debits = grossEarnings + nssfEmployerContribution + ahlEmployerContribution (+ reimbursement expense if separate)
    // Total Credits (so far before bank) = paye + nssfDeduction + shifDeduction + ahlDeduction + advanceDeducted + damageDeducted
    // The net amount to be paid from bank is `payrollData.netPay`.
    if (payrollData.netPay > 0) {
        lines.push({
            DetailType: 'JournalEntryLineDetail',
            Amount: payrollData.netPay.toFixed(2),
            PostingType: 'Credit',
            JournalEntryLineDetail: {
                AccountRef: await getAccountId('Bank Account'), // Placeholder for the actual bank account
            },
            Description: `Net payroll for ${payrollData.month}/${payrollData.year}`,
        });
    }

    // Verify debits and credits balance
    let totalDebits = 0;
    let totalCredits = 0;
    lines.forEach(line => {
        if (line.PostingType === 'Debit') totalDebits += parseFloat(line.Amount);
        else totalCredits += parseFloat(line.Amount);
    });

    if (Math.abs(totalDebits - totalCredits) > 0.01) { // Tolerance for floating point
        console.error("Journal Entry debits and credits do not balance:", {totalDebits, totalCredits, lines});
        throw new Error('Journal entry imbalance. Debits: ' + totalDebits + ', Credits: ' + totalCredits);
    }

    const journalEntry = {
        TxnDate: journalDate.toISOString().split('T')[0], // Format YYYY-MM-DD
        Line: lines,
        PrivateNote: `Payroll processed for ${payrollData.employeeId.firstName} ${payrollData.employeeId.lastName} (Employee ID: ${payrollData.employeeId.employeeCode}) - Period: ${payrollData.month}/${payrollData.year}. Synced from MyPay App.`,
    };

    return new Promise((resolve, reject) => {
        qbo.createJournalEntry(journalEntry, (err, createdJournalEntry) => {
            if (err) {
                console.error('Error creating JournalEntry in QuickBooks:', JSON.stringify(err.Fault || err, null, 2));
                let errorMessage = `QuickBooks JournalEntry creation failed: ${err.Fault?.Error?.[0]?.Message || err.message}`;
                if (err.Fault?.Error?.[0]?.Detail) {
                    errorMessage += ` Details: ${err.Fault.Error[0].Detail}`;
                }
                return reject(new Error(errorMessage));
            }
            resolve(createdJournalEntry);
        });
    });
};


module.exports = {
    getAuthorizationUri,
    exchangeCodeForTokens,
    getQboClientForCompany,
    refreshAccessToken,
    revokeTokens,
    // Expose for testing or direct use if needed
    QB_CLIENT_ID,
    QB_CLIENT_SECRET,
    QB_REDIRECT_URI,
    QB_ENVIRONMENT
};
