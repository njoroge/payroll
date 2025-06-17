const multer = require('multer');
const path = require('path');
const fs = require('fs');

const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Department = require('../models/Department');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        cb(null, uniqueSuffix + '-' + sanitizedOriginalName);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/gif' || file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

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

        if (!groupConversation) {
            groupConversation = new Conversation({
                name: groupChatName,
                companyId: userCompanyId,
                type: 'group',
                participants: departmentMemberUserIds,
            });
            await groupConversation.save();
            groupConversation = await Conversation.findById(groupConversation._id)
                .populate('participants', 'firstName lastName email role _id');
        } else {
            const initialParticipantCount = groupConversation.participants.length;
            groupConversation.participants = [...new Set([...groupConversation.participants.map(p => p._id.toString()), ...departmentMemberUserIds.map(id => id.toString())])];
            if (groupConversation.participants.length > initialParticipantCount || groupConversation.isModified('participants')) {
                 await groupConversation.save();
            }
            // Always repopulate to ensure consistency, especially if lastMessage needs it
            groupConversation = await Conversation.findById(groupConversation._id)
                .populate('participants', 'firstName lastName email role _id')
                .populate({
                    path: 'lastMessage',
                    select: 'content senderId createdAt contentType fileName',
                    populate: { path: 'senderId', select: 'firstName lastName email _id' }
                });
        }
        return groupConversation;
    } catch (error) {
        console.error('Error in getOrCreateDepartmentGroupChat:', error);
        return null;
    }
};

const getConversations = async (req, res) => {
    try {
        const userId = req.user.id;
        let userConversations = [];
        const employee = await Employee.findOne({ userId: userId, companyId: req.user.companyId });
        let userDepartmentId = null;
        const userCompanyId = req.user.companyId;

        if (employee) {
            userDepartmentId = employee.departmentId;
        }

        if (userDepartmentId && userCompanyId) {
            const departmentGroupChat = await getOrCreateDepartmentGroupChat(userId, userCompanyId, userDepartmentId);
            if (departmentGroupChat) {
                userConversations.push(departmentGroupChat);
            }
        }

        const directConversations = await Conversation.find({
                companyId: userCompanyId,
                participants: userId,
                type: 'direct'
            })
            .populate('participants', 'firstName lastName email role _id')
            .populate({
                path: 'lastMessage',
                select: 'content senderId createdAt contentType fileName',
                populate: { path: 'senderId', select: 'firstName lastName email _id' }
            })
            .sort({ updatedAt: -1 });

        const allConversationsMap = new Map();
        userConversations.forEach(conv => allConversationsMap.set(conv._id.toString(), conv));
        directConversations.forEach(conv => {
            if (!allConversationsMap.has(conv._id.toString())) {
                allConversationsMap.set(conv._id.toString(), conv);
            }
        });

        let combinedConversations = Array.from(allConversationsMap.values());
        combinedConversations.sort((a, b) => {
            const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(a.updatedAt);
            const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(b.updatedAt);
            return dateB - dateA;
        });
        res.json(combinedConversations);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ message: 'Server error fetching conversations.' });
    }
};

const getMessagesForConversation = async (req, res) => {
    try {
        const userId = req.user.id;
        const { conversationId } = req.params;
        const limit = parseInt(req.query.limit) || 20;
        const before = req.query.before;

        const conversation = await Conversation.findOne({
            _id: conversationId,
            companyId: req.user.companyId,
            participants: userId
        });

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found or you are not a participant.' });
        }

        let query = {
            conversationId: conversationId,
            // Filter out messages deleted for the current user
            // and messages not deleted for everyone (or ensure isDeletedForAll is false)
            $and: [
                { deletedForUsers: { $ne: userId } }, // Message is NOT in the user's "deleted for me" list
                // { isDeletedForAll: { $ne: true } } // And message is NOT deleted for everyone - This might be handled by content replacement
            ]
        };
        if (before) {
            query.createdAt = { $lt: new Date(before) };
        }

        const messages = await Message.find(query)
            .populate('senderId', 'firstName lastName email role _id')
            .sort({ createdAt: -1 })
            .limit(limit);

        res.json(messages.reverse());

    } catch (error) {
        console.error('Error fetching messages:', error);
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
             return res.status(400).json({ message: 'Invalid conversation ID format.' });
        }
        if (error.name === 'CastError' && error.path === 'createdAt') {
            return res.status(400).json({ message: 'Invalid "before" (cursor) timestamp format for messages.' });
        }
        res.status(500).json({ message: 'Server error fetching messages.' });
    }
};

const uploadFileForConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded or file type rejected.' });
        }

        const conversation = await Conversation.findOne({
            _id: conversationId,
            companyId: req.user.companyId,
            participants: userId
        });

        if (!conversation) {
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ message: 'Conversation not found or you are not a participant.' });
        }

        let contentType = 'file';
        if (req.file.mimetype.startsWith('image/')) {
            contentType = 'image';
        } else if (req.file.mimetype === 'application/pdf') {
            contentType = 'pdf';
        }

        const newMessage = new Message({
            conversationId: conversationId,
            senderId: userId,
            content: '',
            contentType: contentType,
            fileName: req.file.originalname,
            fileUrl: `/uploads/${req.file.filename}`,
            fileType: req.file.mimetype,
            fileSize: req.file.size,
            readBy: [{ readerId: userId, readAt: new Date() }]
        });

        await newMessage.save();

        conversation.lastMessage = newMessage._id;
        conversation.updatedAt = new Date();
        await conversation.save();

        const populatedFileMessage = await Message.findById(newMessage._id)
            .populate('senderId', 'firstName lastName email role _id');

        const io = req.app.get('socketio');
        if (io) {
            const populatedConversationForEmit = await Conversation.findById(conversationId)
                .populate('participants', 'firstName lastName email role _id')
                .populate({
                    path: 'lastMessage',
                    populate: { path: 'senderId', select: 'firstName lastName email _id' }
                });

            if (populatedConversationForEmit) {
                io.to(conversationId.toString()).emit('newMessage', {
                    message: populatedFileMessage,
                    conversation: populatedConversationForEmit
                });
            } else {
                console.error(`Could not find conversation ${conversationId} for WebSocket emit after file upload.`);
            }
        } else {
            console.error('Socket.io instance not found in app context during file upload.');
        }

        res.status(201).json(populatedFileMessage);

    } catch (error) {
        console.error('Error uploading file:', error);
        if (req.file && req.file.path) {
            if (fs.existsSync(req.file.path)) {
                 fs.unlinkSync(req.file.path);
            }
        }
        if (error.message.startsWith('Invalid file type')) {
             return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error during file upload.' });
    }
};

const deleteMessageForEveryone = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;
        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ message: 'Message not found.' });
        }
        if (message.senderId.toString() !== userId) {
            return res.status(403).json({ message: 'Unauthorized: You can only delete your own messages.' });
        }
        if (message.isDeletedForAll) {
            const populatedAlreadyDeletedMessage = await Message.findById(message._id)
                .populate('senderId', 'firstName lastName email role _id');
            return res.status(200).json({ message: 'Message already deleted for everyone.', updatedMessage: populatedAlreadyDeletedMessage });
        }

        message.content = '[Message deleted]';
        message.isDeletedForAll = true;
        message.deletedForAllAt = new Date();
        message.fileUrl = null;
        message.fileName = null;
        message.fileType = null;
        message.fileSize = null;

        const updatedMessage = await message.save();
        const populatedUpdatedMessage = await Message.findById(updatedMessage._id)
            .populate('senderId', 'firstName lastName email role _id');

        const io = req.app.get('socketio');
        if (io && message.conversationId) {
            io.to(message.conversationId.toString()).emit('messageUpdated', populatedUpdatedMessage);
            console.log(`Emitted 'messageUpdated' to room ${message.conversationId} for message ${message._id}`);
        }
        res.status(200).json({ message: 'Message deleted for everyone.', updatedMessage: populatedUpdatedMessage });
    } catch (error) {
        console.error('Error in deleteMessageForEveryone:', error);
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
             return res.status(400).json({ message: 'Invalid message ID format.' });
        }
        res.status(500).json({ message: 'Server error while deleting message.' });
    }
};

// @desc    Delete a message for the requesting user only (hide from their view)
// @route   POST /api/messages/:messageId/delete-for-myself
// @access  Private
const deleteMessageForMyself = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ message: 'Message not found.' });
        }

        if (!message.deletedForUsers.includes(userId)) {
            message.deletedForUsers.push(userId);
            await message.save();
            res.status(200).json({ message: 'Message marked as deleted for you.' });
        } else {
            res.status(200).json({ message: 'Message already deleted for you.' });
        }

    } catch (error) {
        console.error('Error in deleteMessageForMyself:', error);
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
             return res.status(400).json({ message: 'Invalid message ID format.' });
        }
        res.status(500).json({ message: 'Server error while deleting message for yourself.' });
    }
};

module.exports = {
    getConversations,
    getMessagesForConversation,
    uploadFileForConversation,
    upload,
    deleteMessageForEveryone,
    deleteMessageForMyself
};
