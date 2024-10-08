const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const User = require('./models/User'); // Import the User model

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/FilePool', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

const users = {};

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('registerUser', async ({ username, storageSpace }) => {
    try {
      let user = await User.findOne({ username });

      if (user) {
        // User already exists, handle login
        console.log(`User logged in: ${username}`);
        socket.emit('loginSuccess', { message: 'Login successful', user });
      } else {
        // New user registration
        user = new User({ username, storageSpace });
        await user.save();
        console.log(`User registered: ${username}, offering ${storageSpace}GB`);
        socket.emit('registrationSuccess', { message: 'Registration successful', user });
      }

      // Update the user list
      users[socket.id] = { username, storageSpace, socketId: socket.id };
      io.emit('userList', Object.values(users));
    } catch (error) {
      console.error('Error registering user:', error);
      socket.emit('error', { message: 'Error registering user' });
    }
  });
  
  // WebRTC signaling
  socket.on('offer', (data) => {
    socket.to(data.target).emit('offer', {
      sdp: data.sdp,
      sender: socket.id
    });
  });

  socket.on('answer', (data) => {
    socket.to(data.target).emit('answer', {
      sdp: data.sdp,
      sender: socket.id
    });
  });

  socket.on('iceCandidate', (data) => {
    socket.to(data.target).emit('iceCandidate', {
      candidate: data.candidate,
      sender: socket.id
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    delete users[socket.id];
    io.emit('userList', Object.values(users));
  });
});

// API endpoint to check if user exists
app.get('/api/users/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ username });
    if (user) {
      res.json({ exists: true, user });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

server.listen(2000, () => {
  console.log('Server running on port 2000');
});
