const mongoose = require('mongoose');

const advanceSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    companyId: { // For easier querying/scoping
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    amount: { type: Number, required: true, min: 0 },
    dateIssued: { type: Date, default: Date.now },
    reason: { type: String, trim: true },
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

const Advance = mongoose.model('Advance', advanceSchema);
module.exports = Advance;
