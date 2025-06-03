const mongoose = require('mongoose');

const damageSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    amount: { type: Number, required: true, min: 0 },
    dateIncurred: { type: Date, default: Date.now },
    description: { type: String, trim: true, required: true },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'DEDUCTED', 'SETTLED_MANUALLY'],
        default: 'PENDING'
    },
    payrollId: { // Link to payroll where it was deducted
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payroll'
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dateApproved: { type: Date },
    deductedOnPayPeriod: { type: String } // e.g., "YYYY-MM"
}, { timestamps: true });

const Damage = mongoose.model('Damage', damageSchema);
module.exports = Damage;
