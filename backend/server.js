const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const checkDiskSpace = require('check-disk-space').default;
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Update the CORS configuration to allow the frontend
app.use(cors({
  origin: 'http://localhost:5173',  // Allow the Vite frontend
  methods: ['GET', 'POST'],
  credentials: true  // Allow cookies with CORS if needed
}));

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:5173',  // Allow Vite origin for socket.io
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/FilePool', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// Define user schema and model
const User = mongoose.model('User', new mongoose.Schema({
  username: String,
  socketId: String
}));

// Socket.io connections and events
io.on('connection', (socket) => {
  console.log('New client connected');

  // Register user
  socket.on('register', async (username) => {
    console.log('Registering user:', username);
    await User.findOneAndUpdate(
      { username },
      { username, socketId: socket.id },
      { upsert: true, new: true }
    );
    io.emit('users', await User.find({}, 'username'));
  });

  // Handle offer from peer A to peer B
  socket.on('offer', async (data) => {
    const receiver = await User.findOne({ username: data.to });
    if (receiver) {
      io.to(receiver.socketId).emit('offer', {
        from: data.from,
        offer: data.offer
      });
    }
  });

  // Handle answer from peer B to peer A
  socket.on('answer', async (data) => {
    const sender = await User.findOne({ username: data.to });
    if (sender) {
      io.to(sender.socketId).emit('answer', {
        from: data.from,
        answer: data.answer
      });
    }
  });

  // Handle ICE candidates exchange
  socket.on('ice-candidate', async (data) => {
    const peer = await User.findOne({ username: data.to });
    if (peer) {
      io.to(peer.socketId).emit('ice-candidate', {
        from: data.from,
        candidate: data.candidate
      });
    }
  });

  // Check available disk space on the user's machine
  socket.on('check-space', async (data) => {
    try {
      const path = process.platform === 'win32' ? 'C:\\' : '/'; // Adjust based on OS
      const space = await checkDiskSpace(path);
      socket.emit('space-result', {
        available: space.free > data.fileSize
      });
    } catch (error) {
      console.error('Error checking disk space:', error);
      socket.emit('space-result', { error: 'Failed to check disk space' });
    }
  });

  // Handle user disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected');
    User.findOneAndDelete({ socketId: socket.id });
  });
});

// Start server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
