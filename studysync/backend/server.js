const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const path = require('path');
const Message = require('./models/Message');

dotenv.config();

connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/groups', require('./routes/groupRoutes'));
app.use('/api/notes', require('./routes/noteRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

// Socket.io
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinGroup', (groupId) => {
    socket.join(groupId);
    console.log(`User ${socket.id} joined group ${groupId}`);
  });

  socket.on('sendMessage', async (data) => {
    // data: { groupId, user, message, time }
    try {
        const newMessage = await Message.create({
            group: data.groupId,
            sender: data.user._id, // Assuming user object with _id is passed
            content: data.message
        });
        
        // Populate sender info before emitting
        const populatedMessage = await newMessage.populate('sender', 'name');

        io.to(data.groupId).emit('receiveMessage', {
            _id: populatedMessage._id,
            group: data.groupId,
            sender: populatedMessage.sender,
            content: data.message,
            createdAt: populatedMessage.createdAt
        });
    } catch (error) {
        console.error("Error saving message:", error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
