const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Department name is required'],
        trim: true
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE'],
        default: 'ACTIVE'
    }
}, { timestamps: true });

// Ensure a department name is unique within a company
departmentSchema.index({ name: 1, companyId: 1 }, { unique: true });

const Department = mongoose.model('Department', departmentSchema);
module.exports = Department;
