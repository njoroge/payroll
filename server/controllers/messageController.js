const multer = require('multer');
const path = require('path');
const fs = require('fs'); // For directory creation if needed, though done via bash for now

const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User'); // For populating participant details
const Employee = require('../models/Employee'); // Added for department group chat
const Department = require('../models/Department'); // Added for department group chat

// Ensure uploads directory exists (it should have been created by bash)
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Sanitize filename and make it unique
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        cb(null, uniqueSuffix + '-' + sanitizedOriginalName);
    }
});

const fileFilter = (req, file, cb) => {
    // Accept images (jpeg, png, gif) and PDFs
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/gif' || file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});


// Helper function to get or create a department group chat
const getOrCreateDepartmentGroupChat = async (requestingUserId, userCompanyId, userDepartmentId) => {
    try {
        const department = await Department.findById(userDepartmentId);
        if (!department) {
            console.log(`Department not found for ID: ${userDepartmentId}`);
            return null;
        }

        const groupChatName = `${department.name} Group Chat`;

        let groupConversation = await Conversation.findOne({
            type: 'group',
            name: groupChatName,
            companyId: userCompanyId,
        });

        const departmentEmployees = await Employee.find({
            departmentId: userDepartmentId,
            companyId: userCompanyId,
        }).select('userId');

        const departmentMemberUserIds = departmentEmployees.map(emp => emp.userId);

        // Ensure the requesting user is part of the member list if they belong to the department
        // This check is somewhat implicitly handled by the fact that `requestingUserId`'s department is `userDepartmentId`
        // but explicitly adding them if not present (e.g. if they are an admin creating it) can be a good practice.
        // However, for this specific design, we assume `requestingUserId` is already part of `departmentMemberUserIds`
        // if they are in that department.

        if (!groupConversation) {
            groupConversation = new Conversation({
                name: groupChatName,
                companyId: userCompanyId,
                type: 'group',
                participants: departmentMemberUserIds,
                // lastMessage will be updated automatically when a message is sent
            });
            await groupConversation.save();
            // Populate participants after saving to get full user objects
            groupConversation = await Conversation.findById(groupConversation._id)
                .populate('participants', 'firstName lastName email role _id');

        } else {
            // If conversation exists, ensure all current department members are participants
            const initialParticipantCount = groupConversation.participants.length;
            groupConversation.participants = [...new Set([...groupConversation.participants.map(p => p._id.toString()), ...departmentMemberUserIds.map(id => id.toString())])];

            // Check if participants were added and save
            if (groupConversation.participants.length > initialParticipantCount || groupConversation.isModified('participants')) {
                 // Repopulate if changed. Mongoose $addToSet might be better if we don't want to overwrite but ensure presence.
                 // For simplicity here, we reset and then will repopulate.
                 // A more optimized way for existing chats would be to use $addToSet for each userId.
                 await groupConversation.save();
                 groupConversation = await Conversation.findById(groupConversation._id)
                    .populate('participants', 'firstName lastName email role _id')
                    .populate({
                        path: 'lastMessage',
                        select: 'content senderId createdAt contentType',
                        populate: { path: 'senderId', select: 'firstName lastName email _id' }
                    });
            } else {
                // If no changes to participants, still populate for consistency
                groupConversation = await Conversation.findById(groupConversation._id)
                    .populate('participants', 'firstName lastName email role _id')
                    .populate({
                        path: 'lastMessage',
                        select: 'content senderId createdAt contentType',
                        populate: { path: 'senderId', select: 'firstName lastName email _id' }
                    });
            }
        }
        return groupConversation;
    } catch (error) {
        console.error('Error in getOrCreateDepartmentGroupChat:', error);
        return null; // Or throw error to be caught by caller
    }
};

// @desc    Get all conversations for the logged-in user
// @route   GET /api/messages/conversations
// @access  Private
const getConversations = async (req, res) => {
    try {
        const userId = req.user.id; // req.user is populated by 'protect' middleware
        let userConversations = [];

        // Fetch user's employee details to get department and company
        // req.user should already have companyId, but we need departmentId from Employee model
        const employee = await Employee.findOne({ userId: userId, companyId: req.user.companyId });

        let userDepartmentId = null;
        // req.user.companyId should be reliable from the 'protect' or similar middleware
        const userCompanyId = req.user.companyId;

        if (employee) {
            userDepartmentId = employee.departmentId;
        }

        // Get/Create Departmental Group Chat
        if (userDepartmentId && userCompanyId) {
            const departmentGroupChat = await getOrCreateDepartmentGroupChat(userId, userCompanyId, userDepartmentId);
            if (departmentGroupChat) {
                // Ensure lastMessage is populated for sorting, even if it's null
                if (!departmentGroupChat.lastMessage) {
                     // If lastMessage is null, Mongoose won't populate it.
                     // We can manually ensure the structure is consistent if needed, or rely on client-side handling.
                     // For sorting, updatedAt (timestamp of conversation) is the primary sort key.
                }
                userConversations.push(departmentGroupChat);
            }
        }

        // Fetch Direct Conversations
        const directConversations = await Conversation.find({
                companyId: userCompanyId, // Scope by company
                participants: userId,
                type: 'direct' // Only fetch direct chats here
            })
            .populate('participants', 'firstName lastName email role _id')
            .populate({
                path: 'lastMessage',
                select: 'content senderId createdAt contentType',
                populate: { path: 'senderId', select: 'firstName lastName email _id' }
            })
            .sort({ updatedAt: -1 }); // Sort direct conversations by most recent activity

        // Combine department chat (if any) with direct conversations
        // We use a Set to ensure the department chat isn't duplicated if somehow fetched by both queries
        // (though `type: 'direct'` should prevent this for the second query)
        const allConversationsMap = new Map();

        userConversations.forEach(conv => allConversationsMap.set(conv._id.toString(), conv));
        directConversations.forEach(conv => {
            if (!allConversationsMap.has(conv._id.toString())) { // Avoid duplicates
                allConversationsMap.set(conv._id.toString(), conv);
            }
        });

        let combinedConversations = Array.from(allConversationsMap.values());

        // Sort the final combined list by updatedAt
        combinedConversations.sort((a, b) => {
            const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(a.updatedAt);
            const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(b.updatedAt);
            return dateB - dateA; // For descending order
        });

        // If sorting by updatedAt of the conversation (not necessarily last message)
        // combinedConversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));


        res.json(combinedConversations);
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

// @desc    Upload a file for a conversation
// @route   POST /api/messages/upload/:conversationId
// @access  Private
const uploadFileForConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded or file type rejected.' });
        }

        // Validate conversation
        const conversation = await Conversation.findOne({
            _id: conversationId,
            companyId: req.user.companyId, // Ensure conversation belongs to user's company
            participants: userId // Ensure user is part of this conversation
        });

        if (!conversation) {
            // If file was uploaded but conversation is invalid, delete the file
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ message: 'Conversation not found or you are not a participant.' });
        }

        // Determine contentType based on file mimetype
        let contentType = 'file'; // Default for non-image/pdf files (though filter should prevent this)
        if (req.file.mimetype.startsWith('image/')) {
            contentType = 'image';
        } else if (req.file.mimetype === 'application/pdf') {
            contentType = 'pdf';
        }

        // Create message
        const newMessage = new Message({
            conversationId: conversationId,
            senderId: userId,
            content: '', // Or filename, but fileUrl is primary for files
            contentType: contentType,
            fileName: req.file.originalname,
            fileUrl: `/uploads/${req.file.filename}`, // Relative path
            fileType: req.file.mimetype,
            fileSize: req.file.size,
            readBy: [{ readerId: userId, readAt: new Date() }] // Sender has "read" it
        });

        await newMessage.save();

        // Update conversation's lastMessage and timestamp
        conversation.lastMessage = newMessage._id;
        conversation.updatedAt = new Date(); // Explicitly set for sorting and activity feed
        await conversation.save();

        // Populate sender details for the response
        const populatedFileMessage = await Message.findById(newMessage._id)
            .populate('senderId', 'firstName lastName email role _id');

        // Emit message via WebSocket to other participants in the conversation
        const io = req.app.get('socketio');
        if (io) {
            const populatedConversationForEmit = await Conversation.findById(conversationId)
                .populate('participants', 'firstName lastName email role _id')
                .populate({
                    path: 'lastMessage', // This will be the new file message
                    populate: { path: 'senderId', select: 'firstName lastName email _id' }
                });

            if (populatedConversationForEmit) {
                io.to(conversationId.toString()).emit('newMessage', {
                    message: populatedFileMessage,
                    conversation: populatedConversationForEmit
                });
            } else {
                // Should not happen if conversation was validated before, but good to log
                console.error(`Could not find conversation ${conversationId} for WebSocket emit after file upload.`);
            }
        } else {
            console.error('Socket.io instance not found in app context during file upload.');
        }

        res.status(201).json(populatedFileMessage);

    } catch (error) {
        console.error('Error uploading file:', error);
        // If an error occurs after file upload, attempt to delete the orphaned file
        if (req.file && req.file.path) {
            // Check if file still exists before unlinking
            if (fs.existsSync(req.file.path)) {
                 fs.unlinkSync(req.file.path);
            }
        }
        if (error.message.startsWith('Invalid file type')) { // Error from multer fileFilter
             return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error during file upload.' });
    }
};

module.exports = {
    getConversations,
    getMessagesForConversation,
    uploadFileForConversation, // Add new controller
    upload // Export multer instance for use in routes
    // createConversation
};
