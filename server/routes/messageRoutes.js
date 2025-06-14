const express = require('express');
const router = express.Router();
const { getConversations, getMessagesForConversation /*, createConversation*/ } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // Protect all message routes

// Get all conversations for the logged-in user
router.get('/conversations', getConversations);

// Get messages for a specific conversation
router.get('/conversations/:conversationId/messages', getMessagesForConversation);

// Placeholder: Route to create a new conversation (e.g., by specifying participant IDs)
// This might be more naturally handled via Socket.IO when a user sends the first message
// to someone new, but a REST endpoint could also be useful.
// router.post('/conversations', createConversation);

module.exports = router;
