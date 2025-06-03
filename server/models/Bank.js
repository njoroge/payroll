const mongoose = require('mongoose');

const bankSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Bank name is required'],
        unique: true,
        trim: true
    },
    code: { // Optional: if banks have unique codes like '10A'
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE'],
        default: 'ACTIVE'
    }
}, { timestamps: true });

const Bank = mongoose.model('Bank', bankSchema);
module.exports = Bank;
