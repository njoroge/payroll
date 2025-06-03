const mongoose = require('mongoose');

const reimbursementSchema = new mongoose.Schema({
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
    dateClaimed: { type: Date, default: Date.now },
    description: { type: String, trim: true, required: true },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'PAID_IN_PAYROLL', 'PAID_MANUALLY'],
        default: 'PENDING'
    },
    payrollId: { // Link to payroll where it was added
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payroll'
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dateApproved: { type: Date },
    paidOnPayPeriod: { type: String } // e.g., "YYYY-MM"
}, { timestamps: true });

const Reimbursement = mongoose.model('Reimbursement', reimbursementSchema);
module.exports = Reimbursement;
