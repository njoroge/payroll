const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    settingName: { // e.g., "nhifRates2018", "taxBrackets2023", "nssfRates"
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    value: { // Can be an object, array, or any mixed type
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    isActive: { // To easily switch between different setting versions if needed
        type: Boolean,
        default: true
    },
    companyId: { // Some settings might be company-specific, others global (null companyId)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        default: null // Global setting
    }
}, { timestamps: true });

settingSchema.index({ settingName: 1, companyId: 1 }, { unique: true });


const Setting = mongoose.model('Setting', settingSchema);
module.exports = Setting;
