const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    reason: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    // Optional: Add fields for who approved/rejected and when
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    processedAt: {
        type: Date
    }
}, { timestamps: true });

// Index for faster querying by employeeId and status
leaveSchema.index({ employeeId: 1, status: 1 });
leaveSchema.index({ status: 1 }); // For HR/Admin to query all pending requests

// Validate that endDate is not before startDate
leaveSchema.pre('save', function(next) {
    if (this.endDate < this.startDate) {
        return next(new Error('End date cannot be before start date.'));
    }
    next();
});

const Leave = mongoose.model('Leave', leaveSchema);

module.exports = Leave;
