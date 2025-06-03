const mongoose = require('mongoose');

const incomeGradeSchema = new mongoose.Schema({
    gradeName: {
        type: String,
        required: [true, 'Income grade name is required'],
        trim: true
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    basicSalary: { type: Number, required: true, min: 0 },
    houseAllowance: { type: Number, default: 0, min: 0 },
    transportAllowance: { type: Number, default: 0, min: 0 },
    hardshipAllowance: { type: Number, default: 0, min: 0 },
    specialAllowance: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Ensure grade name is unique within a company
incomeGradeSchema.index({ gradeName: 1, companyId: 1 }, { unique: true });

const IncomeGrade = mongoose.model('IncomeGrade', incomeGradeSchema);
module.exports = IncomeGrade;
