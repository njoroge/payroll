const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require("socket.io");
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Employee = require('./models/Employee'); // Added
const Conversation = require('./models/Conversation'); // Added
const Message = require('./models/Message'); // Added

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Simple Route
app.get('/', (req, res) => {
    res.send('Payroll MERN API Running with Socket.IO');
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/departments', require('./routes/departmentRoutes'));
app.use('/api/banks', require('./routes/bankRoutes'));
app.use('/api/income-grades', require('./routes/incomeGradeRoutes'));
app.use('/api/payroll-ops', require('./routes/payrollOperationsRoutes'));
app.use('/api/payrolls', require('./routes/payrollRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: ["http://localhost:5173"],
        methods: ["GET", "POST"]
    }
});

app.set('socketio', io); // Make io accessible in controllers

io.use(async (socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
        console.log('Socket Auth: Token not provided');
        return next(new Error('Authentication error: Token not provided'));
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            console.log('Socket Auth: User not found for token ID:', decoded.id);
            return next(new Error('Authentication error: User not found'));
        }
        if (!user.isActive) {
            console.log('Socket Auth: User account is deactivated:', user.email);
            return next(new Error('Authentication error: User account is deactivated'));
        }
        socket.user = user;
        console.log(`Socket Auth: User ${user.email} authenticated for socket ${socket.id}`);
        next();
    } catch (error) {
        console.error('Socket authentication error:', error.message, error.name); // Log name too for clarity

        let clientErrorMessage = 'Authentication error: Invalid token or session.'; // Default client message

        if (error.name === 'TokenExpiredError') {
            clientErrorMessage = 'Authentication error: Your session has expired. Please log in again.';
        } else if (error.name === 'JsonWebTokenError') {
            clientErrorMessage = 'Authentication error: Your session token is invalid. Please log in again.';
        }
        return next(new Error(clientErrorMessage));
    }
});

io.on('connection', (socket) => {
    console.log(`User connected via Socket.IO: ${socket.id}, Name: ${socket.user.email}, Role: ${socket.user.role}`);

    socket.join(socket.user._id.toString());
    console.log(`User ${socket.user.email} joined personal room: ${socket.user._id.toString()}`);

    if (socket.user.companyId) {
        socket.join(socket.user.companyId.toString());
        console.log(`User ${socket.user.email} joined company room: ${socket.user.companyId.toString()}`);
    }

    socket.on('joinConversationRoom', (conversationId) => {
        if (conversationId) {
            // TODO: Future enhancement: Verify user is part of this conversation before joining
            socket.join(conversationId.toString());
            console.log(`User ${socket.user.email} (${socket.id}) joined conversation room ${conversationId}`);
        }
    });

    socket.on('leaveConversationRoom', (conversationId) => {
        if (conversationId) {
            socket.leave(conversationId.toString());
            console.log(`User ${socket.user.email} (${socket.id}) left conversation room ${conversationId}`);
        }
    });

    socket.on('sendMessage', async (data) => {
        try {
            const { conversationId, content, recipientId } = data;
            const senderId = socket.user._id;

            if (!content || !content.trim()) {
                socket.emit('sendMessageError', { message: 'Message content cannot be empty.' });
                return;
            }

            let currentConversationId = conversationId;
            let conversation;

            if (!currentConversationId && recipientId) {
                if (senderId.toString() === recipientId.toString()) {
                    socket.emit('sendMessageError', { message: 'Cannot start a conversation with yourself.' });
                    return;
                }
                const participants = [senderId, recipientId].sort();

                // 1. Attempt to find an existing conversation
                let isNewConversation = false; // Flag to track if we created it
                conversation = await Conversation.findOne({
                    companyId: socket.user.companyId,
                    participants: { $all: participants, $size: participants.length }
                });

                // 2. If not found, create a new one
                if (!conversation) {
                    conversation = await Conversation.create({
                        companyId: socket.user.companyId,
                        participants: participants
                        // type defaults to 'direct'
                    });
                    isNewConversation = true;
                }

                currentConversationId = conversation._id;
                socket.join(currentConversationId.toString()); // Join the room
                console.log(`User ${socket.user.email} ensured joined to room ${currentConversationId}. New: ${isNewConversation}`);

                // If it's a newly created conversation, notify the recipient so they can update their UI.
                if (isNewConversation) {
                    // recipientId is an Employee._id, passed from client search selection
                    const recipientEmployee = await Employee.findById(recipientId).select('userId');
                    if (recipientEmployee && recipientEmployee.userId) {
                        const recipientUserIdStr = recipientEmployee.userId.toString();

                        // Populate conversation details for the specific recipient
                        // This ensures the recipient gets fully populated participant info for the new conversation item
                        const populatedNewConversation = await Conversation.findById(currentConversationId)
                            .populate('participants', 'firstName lastName email role _id') // Populate all participants
                            .populate({ // Optionally populate lastMessage if it's set by this point (though for a new conv, it might not be)
                                path: 'lastMessage',
                                populate: { path: 'senderId', select: 'firstName lastName email _id' }
                            });

                        io.to(recipientUserIdStr).emit('newConversation', populatedNewConversation);
                        console.log(`Emitted 'newConversation' to user room ${recipientUserIdStr} (for employee ${recipientId}) for conv ${currentConversationId}`);
                    } else {
                        console.error(`Could not find/get user ID for employee ${recipientId} to send 'newConversation' event for conversation ${currentConversationId}.`);
                    }
                }

            } else if (currentConversationId) {
                conversation = await Conversation.findOne({
                    _id: currentConversationId,
                    participants: senderId, // Ensure sender is part of the conversation
                    companyId: socket.user.companyId // Ensure conversation belongs to the same company
                });
                if (!conversation) {
                    socket.emit('sendMessageError', { conversationId: currentConversationId, message: 'Conversation not found or you are not a participant.' });
                    return;
                }
            } else {
                socket.emit('sendMessageError', { message: 'Conversation ID or Recipient ID must be provided.' });
                return;
            }

            const message = new Message({
                conversationId: currentConversationId,
                senderId,
                content: content.trim(),
            });
            await message.save();

            // Update conversation's last message
            conversation.lastMessage = message._id;
            await conversation.save();

            // Populate message sender details
            const populatedMessage = await Message.findById(message._id)
                .populate('senderId', 'firstName lastName email role _id');

            // Populate conversation details for emitting (participants and last message)
            const populatedConversationForEmit = await Conversation.findById(currentConversationId)
                .populate('participants', 'firstName lastName email role _id')
                .populate({
                    path: 'lastMessage',
                    populate: { path: 'senderId', select: 'firstName lastName email _id' }
                });

            // Emit the new message to all clients in the conversation room
            io.to(currentConversationId.toString()).emit('newMessage', {
                message: populatedMessage,
                conversation: populatedConversationForEmit // Send the updated conversation object
            });

        } catch (error) {
            console.error('Error in sendMessage handler:', error);
            socket.emit('sendMessageError', {
                conversationId: data.conversationId, // Include conversationId if available
                message: 'Server error processing your message. ' + error.message
            });
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected via Socket.IO: ${socket.id}`);
    });
});

// Global error handler (Express middleware)
app.use((err, req, res, next) => {
    console.error("Global Error Handler:", err.stack);
    if (res.headersSent) {
        return next(err); // Delegate to default Express error handler if headers already sent
    }
    res.status(err.status || 500).json({ message: err.message || 'Something broke!' });
});

const PORT = process.env.PORT || 5001;

httpServer.listen(PORT, () => {
    console.log(`Server with Socket.IO running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
