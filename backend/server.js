require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

console.log('🚀 Starting MealLoop Backend Server...');

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        process.env.FRONTEND_URL, 
        process.env.CORS_ORIGIN,
        'https://mealloop-1.onrender.com',
        'https://mealloop-frontend.onrender.com',
        'https://mealloop-app.onrender.com'
      ].filter(Boolean)
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Request logging
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.url} - Origin: ${req.get('Origin')}`);
  next();
});

app.use(express.json());

// Enhanced MongoDB Atlas connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    
    if (!mongoURI) {
      throw new Error('MONGO_URI environment variable is not defined');
    }

    console.log('🔗 Connecting to MongoDB Atlas...');
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    
    console.log('✅ MongoDB Atlas connected successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    
    // Listen for connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Connect to database
connectDB();

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [
          process.env.FRONTEND_URL, 
          process.env.CORS_ORIGIN,
          'https://mealloop-1.onrender.com',
          'https://mealloop-frontend.onrender.com',
          'https://mealloop-app.onrender.com'
        ].filter(Boolean)
      : ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io accessible in routes/controllers
app.set('io', io);

console.log('🔌 Socket.IO server initialized');

// Basic routes
app.get('/', (req, res) => {
  console.log('📍 Root endpoint hit');
  res.send('MealLoop API Running');
});

// Base API route
app.get('/api', (req, res) => {
  console.log('📍 API info endpoint hit');
  res.json({
    message: 'MealLoop API is running',
    status: 'OK',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/api/health',
      '/api/auth/login',
      '/api/auth/signup',
      '/api/donations',
      '/api/users',
      '/api/chat'
    ]
  });
});

// Health check endpoint for Render
app.get('/api/health', async (req, res) => {
  console.log('🏥 Health check endpoint hit');
  try {
    // Check database connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const dbName = mongoose.connection.name || 'unknown';
    
    // Test database with a simple query
    let dbTest = 'failed';
    try {
      await mongoose.connection.db.admin().ping();
      dbTest = 'success';
    } catch (dbError) {
      console.error('Database ping failed:', dbError);
    }
    
    // Basic health info
    const healthInfo = {
      status: 'OK',
      message: 'MealLoop Backend is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbStatus,
        name: dbName,
        host: mongoose.connection.host || 'unknown',
        test: dbTest
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version
    };

    res.status(200).json(healthInfo);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'ERROR',
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Import and use routes with error handling
console.log('📂 Loading routes...');

try {
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes loaded');
} catch (error) {
  console.error('❌ Failed to load auth routes:', error.message);
  process.exit(1);
}

try {
  const userRoutes = require('./routes/users');
  app.use('/api/users', userRoutes);
  console.log('✅ User routes loaded');
} catch (error) {
  console.error('❌ Failed to load user routes:', error.message);
  process.exit(1);
}

try {
  const donationRoutes = require('./routes/donations');
  app.use('/api/donations', donationRoutes);
  console.log('✅ Donation routes loaded');
} catch (error) {
  console.error('❌ Failed to load donation routes:', error.message);
  process.exit(1);
}

try {
  const chatRoutes = require('./routes/chat');
  app.use('/api/chat', chatRoutes);
  console.log('✅ Chat routes loaded');
} catch (error) {
  console.error('❌ Failed to load chat routes:', error.message);
  process.exit(1);
}

try {
  const messageRoutes = require('./routes/messages');
  app.use('/api/messages', messageRoutes);
  console.log('✅ Message routes loaded');
} catch (error) {
  console.error('❌ Failed to load message routes:', error.message);
  process.exit(1);
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('💥 Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler for undefined routes
app.use((req, res) => {
  console.log(`❓ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    url: req.originalUrl,
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      '/api/health',
      '/api/auth/login',
      '/api/auth/signup', 
      '/api/donations',
      '/api/users',
      '/api/chat',
      '/api/messages'
    ]
  });
});

// Socket.IO event handlers
const ChatMessage = require('./models/ChatMessage');
const onlineUsers = new Map(); // userId -> socketId
const userRooms = new Map(); // userId -> Set of donationIds

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Listen for user authentication
  socket.on('authenticate', ({ userId }) => {
    console.log('User authenticated:', { userId, socketId: socket.id });
    socket.userId = userId;
    onlineUsers.set(userId, socket.id);
    
    // Notify all rooms this user is in about their online status
    if (userRooms.has(userId)) {
      userRooms.get(userId).forEach(roomId => {
        socket.to(roomId).emit('presence', { userId, online: true });
      });
    }
  });

  // Listen for joining a chat room (per donation)
  socket.on('join_room', async ({ donationId, userId }) => {
    console.log('User joining room:', { donationId, userId, socketId: socket.id });
    
    // Leave any existing rooms for this socket
    socket.rooms.forEach(room => {
      if (room !== socket.id) {
        socket.leave(room);
      }
    });
    
    // Join the new room
    socket.join(donationId);
    socket.userId = userId;
    
    // Update online users
    onlineUsers.set(userId, socket.id);
    
    // Track user's rooms
    if (!userRooms.has(userId)) {
      userRooms.set(userId, new Set());
    } else {
      userRooms.get(userId).clear();
    }
    userRooms.get(userId).add(donationId);
    
    // Mark messages as delivered for this user
    await ChatMessage.updateMany(
      { donation: donationId, receiver: userId, delivered: false },
      { delivered: true, deliveredAt: new Date() }
    );
    
    // Notify presence to others in room
    socket.to(donationId).emit('presence', { userId, online: true });
    
    // Send delivery confirmations to others in room
    socket.to(donationId).emit('messages_delivered', { userId, donationId });
  });

  // Listen for sending a chat message
  socket.on('chat_message', async (data) => {
    try {   
      console.log('Received chat message:', data);
      const { donationId, sender, receiver, message, tempId } = data;
      
      if (!donationId || !sender || !receiver || !message) {
        console.error('Missing required fields in chat message:', data);
        return;
      }
      
      // Prevent self-messaging
      if (sender === receiver) {
        console.error('User trying to message themselves:', { sender, receiver });
        socket.emit('message_error', { error: 'Cannot send message to yourself', tempId });
        return;
      }
      
      // Check if receiver is online and in the room
      const receiverOnline = onlineUsers.has(receiver);
      const receiverInRoom = userRooms.has(receiver) && userRooms.get(receiver).has(donationId);
      const isDelivered = receiverOnline && receiverInRoom;
      
      // Save to DB
      const chatMsg = new ChatMessage({
        donation: donationId,
        sender,
        receiver,
        message,
        delivered: isDelivered,
        deliveredAt: isDelivered ? new Date() : null,
        read: false
      });
      await chatMsg.save();
      
      // Populate sender for frontend
      await chatMsg.populate('sender', 'name email');
      await chatMsg.populate('receiver', 'name email');
      
      // Create response with tempId for sender confirmation
      const responseMsg = { ...chatMsg.toObject(), tempId };
      
      // Emit to sender for confirmation
      socket.emit('message_sent', responseMsg);
      
      // Emit to receiver if in room
      const socketsInRoom = await io.in(donationId).fetchSockets();
      const receiverSocketInRoom = socketsInRoom.find(s => s.userId === receiver);
      
      if (receiverSocketInRoom) {
        // Mark as delivered and send to receiver
        await ChatMessage.findByIdAndUpdate(chatMsg._id, {
          delivered: true,
          deliveredAt: new Date()
        });
        
        const updatedMsg = await ChatMessage.findById(chatMsg._id)
          .populate('sender', 'name email')
          .populate('receiver', 'name email');
        
        receiverSocketInRoom.emit('chat_message', updatedMsg);
        socket.emit('message_delivered', { messageId: chatMsg._id, tempId });
      }
      
    } catch (error) {
      console.error('Error handling chat message:', error);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    if (socket.userId) {
      // Only remove if this is the current socket for this user
      if (onlineUsers.get(socket.userId) === socket.id) {
        onlineUsers.delete(socket.userId);
        
        // Notify all rooms this user was in about offline status
        if (userRooms.has(socket.userId)) {
          userRooms.get(socket.userId).forEach(roomId => {
            socket.to(roomId).emit('presence', { userId: socket.userId, online: false });
          });
          userRooms.delete(socket.userId);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 MealLoop server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 CORS origins: ${JSON.stringify(corsOptions.origin)}`);
  console.log(`🔌 Socket.IO enabled`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});