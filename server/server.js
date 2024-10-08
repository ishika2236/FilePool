const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const ethers = require('ethers');
const contractABI = require('./contracts/StorageLending.json').abi;
const config = require('./config');
const cors = require('cors');

const providerRoute = require('./routes/provider'); 

const app = express();
const server = http.createServer(app);
// const io = socketIo(server);
app.use(express.json());
// app.use(bodyParser.json());
const contractRoute = require('./contract')

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/", { useNewUrlParser: true, useUnifiedTopology: true });

// Connect to Ethereum network (replace with your network details)
const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');

// app.use('/contract',contractRoute);
let contract;
const corsOptions = {
    origin: "http://localhost:5173", // Change this to your frontend URL
    methods: ['GET', 'POST'],
    credentials: true // Allow credentials if needed
  };
  
  app.use(cors(corsOptions));

  
  const io = socketIo(server, {
    cors: {
      origin: "http://localhost:5173", // Same as your Express CORS origin
      methods: ["GET", "POST"],
      credentials: true // Allow credentials if needed
    }
  });
// Adjust the path if needed


app.use('/api/providers/', providerRoute);
// Function to initialize the contract
async function initializeContract(address) {
  try {
    contract = new ethers.Contract(address, contractABI, provider);
    console.log("Contract initialized successfully at address:", address);
  } catch (error) {
    console.error("Error initializing contract:", error);
  }
}

// Endpoint to receive the contract address
app.post('/api/setContractAddress', express.json(), (req, res) => {
  const { address } = req.body;
  if (!address) {
    return res.status(400).json({ error: 'Contract address is required' });
  }
  
  initializeContract(address);
  res.json({ message: 'Contract address set successfully' });
});

// WebRTC signaling
io.on('connection', (socket) => {
    console.log('New client connected');
  
    socket.on('join', (roomId) => {
      socket.join(roomId);
      console.log(`Client joined room: ${roomId}`);
    });
  
    socket.on('offer', (offer, roomId) => {
      console.log(`Received offer in room: ${roomId}`);
      socket.to(roomId).emit('offer', offer);
    });
  
    socket.on('answer', (answer, roomId) => {
      console.log(`Received answer in room: ${roomId}`);
      socket.to(roomId).emit('answer', answer);
    });
  
    socket.on('ice-candidate', (candidate, roomId) => {
      console.log(`Received ICE candidate for room: ${roomId}`);
      socket.to(roomId).emit('ice-candidate', candidate);
    });
  
    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

// Middleware to check if contract is initialized
const contractInitialized = (req, res, next) => {
  if (!contract) {
    return res.status(503).json({ error: 'Contract not yet initialized' });
  }
  next();
};

// API routes
app.use('/api/agreements', require('./routes/agreement'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
