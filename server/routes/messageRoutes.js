const express = require('express');
const router = express.Router();
const {
    getConversations,
    getMessagesForConversation,
    uploadFileForConversation, // Import the new controller
    upload, // Import the multer instance
    deleteMessageForEveryone, // Import the new controller function
    deleteMessageForMyself // Import the new controller function
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // Protect all message routes

// Get all conversations for the logged-in user
router.get('/conversations', getConversations);

// Get messages for a specific conversation
router.get('/conversations/:conversationId/messages', getMessagesForConversation);

// Route for uploading a file to a conversation
// 'chatFile' is the field name expected in the form-data for the file
router.post('/upload/:conversationId', upload.single('chatFile'), uploadFileForConversation);

// Placeholder: Route to create a new conversation (e.g., by specifying participant IDs)
// This might be more naturally handled via Socket.IO when a user sends the first message
// to someone new, but a REST endpoint could also be useful.
// router.post('/conversations', createConversation);

// Delete a message for everyone (sender action)
router.put('/:messageId/delete-for-everyone', deleteMessageForEveryone);

// Delete a message for oneself (hide from user's view)
router.post('/:messageId/delete-for-myself', deleteMessageForMyself);

module.exports = router;
