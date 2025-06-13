const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User'); // For populating participant details

// @desc    Get all conversations for the logged-in user
// @route   GET /api/messages/conversations
// @access  Private
const getConversations = async (req, res) => {
    try {
        const userId = req.user.id; // req.user is populated by 'protect' middleware
        const conversations = await Conversation.find({
                companyId: req.user.companyId, // Scope by company
                participants: userId
            })
            .populate('participants', 'firstName lastName email role _id') // Populate with user details
            .populate({
                path: 'lastMessage',
                select: 'content senderId createdAt contentType', // Select fields for last message
                populate: { path: 'senderId', select: 'firstName lastName email _id' } // Populate sender of last message
            })
            .sort({ updatedAt: -1 }); // Show most recent conversations first (based on last message or participant change)

        res.json(conversations);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ message: 'Server error fetching conversations.' });
    }
};

// @desc    Get messages for a specific conversation
// @route   GET /api/messages/conversations/:conversationId/messages
// @access  Private
const getMessagesForConversation = async (req, res) => {
    try {
        const userId = req.user.id;
        const { conversationId } = req.params;
        // Pagination: limit for number of messages, before for cursor (older messages)
        const limit = parseInt(req.query.limit) || 20; // Default to 20 messages
        const before = req.query.before; // This would be a createdAt timestamp string from the client

        const conversation = await Conversation.findOne({
            _id: conversationId,
            companyId: req.user.companyId, // Ensure conversation belongs to user's company
            participants: userId // Ensure user is part of this conversation
        });

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found or you are not a participant.' });
        }

        let query = { conversationId: conversationId };
        if (before) {
            // Fetch messages created before the 'before' timestamp
            query.createdAt = { $lt: new Date(before) };
        }

        const messages = await Message.find(query)
            .populate('senderId', 'firstName lastName email role _id') // Populate sender details
            .sort({ createdAt: -1 }) // Get newest messages first (from DB)
            .limit(limit);

        // Messages are fetched newest first due to sort({ createdAt: -1 }).
        // Client usually wants them oldest first for display (scroll from bottom).
        // So, reverse the array before sending.
        res.json(messages.reverse());

    } catch (error) {
        console.error('Error fetching messages:', error);
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
             return res.status(400).json({ message: 'Invalid conversation ID format.' });
        }
        // Add more specific error handling if 'before' causes CastError for date
        if (error.name === 'CastError' && error.path === 'createdAt') {
            return res.status(400).json({ message: 'Invalid "before" (cursor) timestamp format for messages.' });
        }
        res.status(500).json({ message: 'Server error fetching messages.' });
    }
};

// Placeholder for creating a conversation if needed via REST
// Will likely be handled via Socket.IO when a new message initiates a conversation
// const createConversation = async (req, res) => { ... };

module.exports = {
    getConversations,
    getMessagesForConversation,
    // createConversation
};
