const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    nationalId: {
        type: String,
        required: [true, 'National ID is required'],
        unique: true,
        trim: true
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    surname: { type: String, trim: true },
    phoneNo: { type: String, unique: true, sparse: true, trim: true }, // sparse for unique if allows null
    personalEmail: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true,
        match: [/.+\@.+\..+/, 'Please fill a valid email address']
    },
    dob: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    kraPin: { type: String, unique: true, sparse: true, trim: true },
    nhifNo: { type: String, unique: true, sparse: true, trim: true },
    nssfNo: { type: String, unique: true, sparse: true, trim: true },
    bankName: { type: String, trim: true }, // Could be a ref to Bank model later
    accountNo: { type: String, unique: true, sparse: true, trim: true },
    maritalStatus: { type: String },
    incomeGradeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'IncomeGrade',
        required: true
    },
    nextOfKin: {
        firstName: { type: String, trim: true },
        lastName: { type: String, trim: true },
        relation: { type: String, trim: true },
        phoneNo: { type: String, trim: true },
        email: { type: String, lowercase: true, trim: true }
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
    },
    employmentStartDate: { type: Date, default: Date.now },
    workStatus: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'TERMINATED', 'ON_LEAVE'],
        default: 'ACTIVE'
    },
    companyId: { // Changed from companyTaxPin to ObjectId ref
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    userId: { // Link to the User model for login
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        unique: true,
        sparse: true // An employee might not have a login initially
    }
}, { timestamps: true });

const Employee = mongoose.model('Employee', employeeSchema);
module.exports = Employee;
