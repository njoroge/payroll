const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
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
    month: { type: String, required: true }, // e.g., "January", "February"
    year: { type: Number, required: true }, // e.g., 2023
    incomeGradeSnapshot: { // Denormalized data for historical accuracy
        gradeName: String,
        basicSalary: Number,
        houseAllowance: Number,
        transportAllowance: Number,
        hardshipAllowance: Number,
        specialAllowance: Number
    },
    grossEarnings: { type: Number, required: true }, // Basic + Allowances
    taxableIncome: { type: Number, required: true },
    paye: { type: Number, default: 0 },
    nssfDeduction: { type: Number, default: 0 },
    nssfEmployerContribution: { type: Number, default: 0 }, // Added for employer's NSSF
    shifDeduction: { type: Number, default: 0 }, // SHIF replaces NHIF
    ahlDeduction: { type: Number, default: 0 }, // Employee's AHL contribution
    ahlEmployerContribution: { type: Number, default: 0 }, // Employer's AHL contribution
    advanceDeducted: { type: Number, default: 0 },
    damageDeducted: { type: Number, default: 0 },
    otherDeductionsTotal: { type: Number, default: 0 }, // For future flexibility
    reimbursementAdded: { type: Number, default: 0 },
    totalDeductions: { type: Number, required: true }, // PAYE + NSSF + SHIF + AHL + Advance + Damage + Other
    netPay: { type: Number, required: true },
    processingDate: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ['PENDING_APPROVAL', 'APPROVED', 'PAID', 'REJECTED', 'CANCELLED'],
        default: 'PENDING_APPROVAL'
    },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dateApproved: { type: Date },
    paymentDate: { type: Date },
    notes: { type: String }
}, { timestamps: true });

payrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true }); // One payslip per employee per month/year

const Payroll = mongoose.model('Payroll', payrollSchema);
module.exports = Payroll;
