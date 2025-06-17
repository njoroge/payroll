const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
        index: true,
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    // receiverId might be implicit via conversation participants,
    // but can be explicit if needed for specific routing or features.
    // For a group/room chat, it's less critical here.
    // Let's keep it simple for now and rely on conversation.participants.
    content: {
        type: String,
        required: true,
        trim: true,
    },
    contentType: { // E.g., 'text', 'image', 'file', 'pdf'
        type: String,
        default: 'text',
    },
    // Fields for file attachments
    fileName: {
        type: String,
        trim: true,
    },
    fileUrl: {
        type: String,
        trim: true,
    },
    fileType: { // E.g., 'image/jpeg', 'application/pdf', 'text/plain'
        type: String,
        trim: true,
    },
    fileSize: { // Size in bytes
        type: Number,
    },
    readBy: [{ // Array of user IDs who have read the message
        readerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now }
    }],
    isDeletedForAll: {
        type: Boolean,
        default: false
    },
    deletedForAllAt: {
        type: Date,
        default: null
    },
    deletedForUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
    // companyId could also be on messages for direct querying, though derivable from conversation
    // companyId: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Company',
    //     required: true
    // }
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
