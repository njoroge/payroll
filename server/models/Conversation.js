const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }],
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
    },
    // Consider adding companyId if conversations are company-specific
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true // Assuming conversations are scoped to a company
    }
}, { timestamps: true });

// Index participants for faster querying of user's conversations
conversationSchema.index({ participants: 1 });
conversationSchema.index({ companyId: 1 });


const Conversation = mongoose.model('Conversation', conversationSchema);
module.exports = Conversation;
