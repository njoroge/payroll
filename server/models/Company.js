const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Company name is required'],
        trim: true
    },
    taxPin: {
        type: String,
        required: [true, 'Company tax PIN is required'],
        unique: true,
        trim: true
    },
    location: {
        type: String,
        trim: true
    },
    companyEmail: { // Differentiated from user email
        type: String,
        required: [true, 'Company email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/.+\@.+\..+/, 'Please fill a valid company email address']
    },
    phone: {
        type: String,
        trim: true
    },
    // Link to the company admin user
    adminUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

const Company = mongoose.model('Company', companySchema);
module.exports = Company;
