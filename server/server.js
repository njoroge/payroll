const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require("socket.io");
const jwt = require('jsonwebtoken');
const User = require('./models/User');
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
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

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
        // JsonWebTokenError can be for various issues like 'invalid signature', 'jwt malformed'.
        // We keep a somewhat generic message for the client here for security.
        clientErrorMessage = 'Authentication error: Your session token is invalid. Please log in again.';
    }
    // Other unexpected errors will also use the default clientErrorMessage.
    // The server log (error.message, error.name) remains key for specific diagnosis.

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
            conversation = await Conversation.findOneAndUpdate(
                {
                    companyId: socket.user.companyId,
                    participants: { $all: participants, $size: participants.length }
                },
                {
                    $setOnInsert: {
                        companyId: socket.user.companyId,
                        participants: participants
                    }
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            currentConversationId = conversation._id;
            // When a new conversation is created/found, make sure both participants join its room
            // The sender (socket.user) is already in their own room.
            // The recipient needs to be notified or join if they are online.
            // The sender's socket should join this new conversation room.
            socket.join(currentConversationId.toString());
            console.log(`User ${socket.user.email} joined newly created/found conversation room ${currentConversationId}`);

            // Emit to recipient's personal room that a new conversation has been started/found for them
            // so their client can update its conversation list and join the room
            io.to(recipientId.toString()).emit('newConversation', conversation);


        } else if (currentConversationId) {
            conversation = await Conversation.findOne({
                _id: currentConversationId,
                participants: senderId,
                companyId: socket.user.companyId
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

        conversation.lastMessage = message._id;
        // conversation.updatedAt = Date.now(); // Mongoose timestamps option handles this on save
        await conversation.save();

        const populatedMessage = await Message.findById(message._id)
            .populate('senderId', 'firstName lastName email role _id');

        const populatedConversationForEmit = await Conversation.findById(currentConversationId)
            .populate('participants', 'firstName lastName email role _id')
            .populate({
                path: 'lastMessage',
                populate: { path: 'senderId', select: 'firstName lastName email _id' }
            });

        // Emit to the conversation room. All participants (including sender) who have joined this room will receive it.
        io.to(currentConversationId.toString()).emit('newMessage', {
            message: populatedMessage,
            conversation: populatedConversationForEmit
        });

    } catch (error) {
        console.error('Error in sendMessage handler:', error);
        socket.emit('sendMessageError', {
            conversationId: data.conversationId,
            message: 'Server error processing your message. ' + error.message
        });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected via Socket.IO: ${socket.id}`);
  });
});

app.use((err, req, res, next) => {
    console.error("Global Error Handler:", err.stack);
    if (res.headersSent) {
        return next(err);
    }
    res.status(err.status || 500).json({ message: err.message || 'Something broke!' });
});

const PORT = process.env.PORT || 5001;

httpServer.listen(PORT, () => {
    console.log(`Server with Socket.IO running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
