# QuickBooks Online Integration

This document provides an overview of the QuickBooks Online (QBO) integration feature, how to set it up, and how it functions.

## Feature Overview

The QuickBooks Online integration allows users to:
1.  Securely connect their company's account in this application to their QuickBooks Online account.
2.  Export processed payroll data as Journal Entries to their QuickBooks Online company.

This helps in keeping accounting records up-to-date with payroll expenses and liabilities.

## Setup and Configuration

### 1. Prerequisites

*   A QuickBooks Online account.
*   Admin or appropriate permissions in this application to manage company settings and payroll.

### 2. Environment Variables

The following environment variables must be configured in the application's backend (`server/.env` file):

*   `QUICKBOOKS_CLIENT_ID`: Your QBO App's Client ID from the Intuit Developer Portal.
*   `QUICKBOOKS_CLIENT_SECRET`: Your QBO App's Client Secret.
*   `QUICKBOOKS_REDIRECT_URI`: The callback URI registered with your QBO App. This should match the application's callback endpoint (e.g., `https://your-app-domain.com/api/quickbooks/callback` or `http://localhost:5001/api/quickbooks/callback` for development).
*   `QUICKBOOKS_ENVIRONMENT`: Set to `sandbox` for testing with a QBO Sandbox account, or `production` for live QBO accounts.

**Example `.env` configuration:**
```dotenv
QUICKBOOKS_CLIENT_ID="your_qbo_app_client_id"
QUICKBOOKS_CLIENT_SECRET="your_qbo_app_client_secret"
QUICKBOOKS_REDIRECT_URI="http://localhost:5001/api/quickbooks/callback"
QUICKBOOKS_ENVIRONMENT="sandbox"
```

### 3. Connecting to QuickBooks Online

1.  Navigate to the company settings or integrations page in the application.
2.  Click on the "Connect to QuickBooks" button.
3.  You will be redirected to the Intuit login page. Log in with your QuickBooks Online credentials.
4.  Authorize the application to access your QBO company data.
5.  Upon successful authorization, you will be redirected back to the application.
6.  The integration status should now show as "Connected."

### 4. Chart of Accounts (Important!)

For payroll data to be correctly posted to QuickBooks, specific accounts must exist in your QuickBooks Chart of Accounts. The integration will attempt to find accounts by these names:

*   **Bank Account (for Net Pay):** `Bank Account` (This should ideally be configurable or selectable, but currently, a common name is assumed. The actual bank account used for payroll.)
*   **Expense Accounts:**
    *   `Salaries and Wages Expense`
    *   `Employer NSSF Expense`
    *   `Employer AHL Expense`
*   **Liability Accounts:**
    *   `Payroll Liabilities - PAYE`
    *   `Payroll Liabilities - NSSF` (for employee deductions)
    *   `Payroll Liabilities - SHIF` (for employee deductions)
    *   `Payroll Liabilities - AHL` (for employee deductions)
    *   `Payroll Liabilities - Advances`
    *   `Payroll Liabilities - Damages`

**If these accounts do not exist with these exact names, the payroll sync will fail.** Please ensure they are set up in your QBO Chart of Accounts. Future enhancements may include a UI for mapping these accounts.

## Usage

### Exporting Payroll Data to QuickBooks

1.  Process your payroll as usual in the application.
2.  Ensure the payroll run is in an "APPROVED" or "PAID" status.
3.  In the payroll section, find the option to "Sync to QuickBooks" for the desired payroll record(s).
4.  Click the sync button. The application will transform the payroll data into a Journal Entry and post it to your connected QuickBooks Online company.
5.  The sync status for that payroll record will be updated (e.g., "Synced," "Failed"). If synced, a QBO Journal Entry ID may be displayed.

### Journal Entry Details

A typical Journal Entry created by this integration will include:

*   **Debits:**
    *   Gross Earnings (to `Salaries and Wages Expense`)
    *   Employer NSSF Contribution (to `Employer NSSF Expense`)
    *   Employer AHL Contribution (to `Employer AHL Expense`)
*   **Credits:**
    *   PAYE Deductions (to `Payroll Liabilities - PAYE`)
    *   Employee NSSF Deductions (to `Payroll Liabilities - NSSF`)
    *   Employee SHIF Deductions (to `Payroll Liabilities - SHIF`)
    *   Employee AHL Deductions (to `Payroll Liabilities - AHL`)
    *   Employee Advances Deducted (to `Payroll Liabilities - Advances`)
    *   Employee Damages Deducted (to `Payroll Liabilities - Damages`)
    *   Net Pay (to your designated `Bank Account`)

The Journal Entry date will typically be the last day of the payroll month.

### Disconnecting from QuickBooks

1.  Navigate to the company settings or integrations page.
2.  If connected, you will see an option to "Disconnect from QuickBooks."
3.  Clicking this will revoke the application's access to your QBO data and clear the stored connection details.

## Troubleshooting

*   **Connection Issues:**
    *   Ensure environment variables are correctly set.
    *   Verify the `QUICKBOOKS_REDIRECT_URI` exactly matches the one in your Intuit Developer app settings.
*   **Sync Failures:**
    *   **"Account not found..." error:** This is the most common issue. Ensure all required accounts (listed in "Chart of Accounts" section above) exist in your QBO company with the exact names.
    *   Check the application logs for more detailed error messages from QuickBooks.
    *   Ensure your QBO access token has not expired or been revoked. Try disconnecting and reconnecting the integration.

## API Endpoints

The following backend API endpoints support the QuickBooks integration:

*   `GET /api/quickbooks/connect`: Initiates the OAuth 2.0 connection.
*   `GET /api/quickbooks/callback`: Handles the OAuth 2.0 callback from QuickBooks.
*   `GET /api/quickbooks/status`: Checks the current QBO connection status for the company.
*   `POST /api/quickbooks/disconnect`: Disconnects from QBO and revokes tokens.
*   `POST /api/quickbooks/sync/payroll/:payrollId`: Syncs a specific payroll record to QBO.

These endpoints are protected and require appropriate user authentication and authorization.
