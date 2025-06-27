const mongoose = require('mongoose');

const quickbooksTokenSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        unique: true, // Each company can only have one set of QBO tokens
    },
    accessToken: {
        type: String, // Will be encrypted in practice, but store as string
        required: true,
    },
    refreshToken: {
        type: String, // Will be encrypted in practice
        required: true,
    },
    realmId: { // This is the QuickBooks Company ID
        type: String,
        required: true,
    },
    tokenExpiryDate: { // UTC timestamp for when the access token expires
        type: Date,
        required: true,
    },
    lastRefreshedAt: { // Timestamp of the last token refresh
        type: Date,
    },
    scope: { // Scopes granted, e.g., 'com.intuit.quickbooks.accounting'
        type: String,
    },
    // We might want to add fields for encryption IV if encrypting fields individually
}, { timestamps: true }); // Adds createdAt and updatedAt

// TODO: Add encryption hooks/methods for accessToken and refreshToken before saving
// For now, they will be stored in plaintext for simplicity of this step.
// In a real application, use libraries like `crypto` or `bcrypt` for encryption,
// or a dedicated secret management service.

const QuickbooksToken = mongoose.model('QuickbooksToken', quickbooksTokenSchema);

module.exports = QuickbooksToken;
