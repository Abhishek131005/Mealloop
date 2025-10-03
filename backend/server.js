require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

app.get('/', (req, res) => res.send('API Running'));

const donationRoutes = require('./routes/donations');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const chatRoutes = require('./routes/chat');
const messageRoutes = require('./routes/messages');
app.use('/api/donations', donationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/messages', messageRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
});

// Make io accessible in routes/controllers
app.set('io', io);

// Socket.IO event handlers
const ChatMessage = require('./models/ChatMessage');
const Donation = require('./models/Donation');
const User = require('./models/User');
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
    
    // Update online users (remove old socket if exists, add new one)
    onlineUsers.set(userId, socket.id);
    
    // Track user's rooms - clear old rooms and add current one
    if (!userRooms.has(userId)) {
      userRooms.set(userId, new Set());
    } else {
      userRooms.get(userId).clear(); // Clear old rooms for this user
    }
    userRooms.get(userId).add(donationId);
    console.log('User rooms updated:', userRooms.get(userId));
    
    // Mark messages as delivered for this user
    const deliveredResult = await ChatMessage.updateMany(
      { donation: donationId, receiver: userId, delivered: false },
      { delivered: true, deliveredAt: new Date() }
    );
    console.log('Marked messages as delivered:', deliveredResult.modifiedCount, 'messages');
    
    // Notify presence to others in room (exclude sender)
    socket.to(donationId).emit('presence', { userId, online: true });
    
    // Send delivery confirmations to others in room
    socket.to(donationId).emit('messages_delivered', { userId, donationId });
  });

  // Check online status of a user
  socket.on('check_presence', ({ userId, donationId }) => {
    const isOnline = onlineUsers.has(userId);
    socket.emit('presence', { userId, online: isOnline });
  });

  // Listen for leaving a chat room
  socket.on('leave_room', ({ donationId, userId }) => {
    socket.leave(donationId);
    
    // Remove from user's rooms
    if (userRooms.has(userId)) {
      userRooms.get(userId).delete(donationId);
      if (userRooms.get(userId).size === 0) {
        userRooms.delete(userId);
      }
    }
    
    // Only send offline if user is actually offline (not just leaving this room)
    const isStillOnline = onlineUsers.has(userId);
    if (!isStillOnline) {
      socket.to(donationId).emit('presence', { userId, online: false });
    }
  });

  // Listen for typing
  socket.on('typing', ({ donationId, userId, isTyping }) => {
    socket.to(donationId).emit('typing', { userId, isTyping });
  });

  // Listen for stop typing
  socket.on('stop_typing', ({ donationId, userId }) => {
    socket.to(donationId).emit('stop_typing', { userId });
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
      
      console.log('Receiver online status:', receiverOnline, 'in room:', receiverInRoom, 'for receiver:', receiver);
      
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
      console.log('Message saved to database:', chatMsg._id);
      
      // Populate sender for frontend
      await chatMsg.populate('sender', 'name email');
      await chatMsg.populate('receiver', 'name email');
      
      // Create response with tempId for sender confirmation
      const responseMsg = { ...chatMsg.toObject(), tempId };
      
      // Emit to sender for confirmation
      socket.emit('message_sent', responseMsg);
      console.log('Sent message_sent confirmation to sender');
      
      // Emit to receiver if in room - this will automatically mark as delivered
      const socketsInRoom = await io.in(donationId).fetchSockets();
      const receiverSocketInRoom = socketsInRoom.find(s => s.userId === receiver);
      
      if (receiverSocketInRoom) {
        // Receiver is in room, mark as delivered and emit message
        await ChatMessage.findByIdAndUpdate(chatMsg._id, {
          delivered: true,
          deliveredAt: new Date()
        });
        
        // Send updated message to both sender and receiver
        const updatedMsg = await ChatMessage.findById(chatMsg._id)
          .populate('sender', 'name email')
          .populate('receiver', 'name email');
        
        // Send to receiver only (not the entire room)
        receiverSocketInRoom.emit('chat_message', updatedMsg);
        socket.emit('message_delivered', { messageId: chatMsg._id, tempId });
        console.log('Message delivered to receiver in room');
      } else {
        // Receiver not in room, don't emit to anyone except sender for confirmation
        console.log('Receiver not in room, message not marked as delivered');
      }
      
      // Send notification to receiver if online but not in room
      const receiverSocketId = onlineUsers.get(receiver);
      if (receiverSocketId && receiverOnline && !receiverInRoom) {
        io.to(receiverSocketId).emit('new_message_notification', {
          donationId,
          sender: chatMsg.sender,
          message: chatMsg.message,
          timestamp: chatMsg.timestamp
        });
        console.log('Sent notification to receiver not in room');
      }
    } catch (error) {
      console.error('Error handling chat message:', error);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  // Listen for message read status
  socket.on('mark_messages_read', async ({ donationId, userId }) => {
    try {
      const result = await ChatMessage.updateMany(
        { donation: donationId, receiver: userId, read: false },
        { read: true, readAt: new Date() }
      );
      
      console.log('Marked messages as read:', result.modifiedCount, 'messages for user:', userId);
      
      // Notify sender about read status
      socket.to(donationId).emit('messages_read', { userId, donationId });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove user from online users and notify all their rooms
    if (socket.userId) {
      console.log('Cleaning up user:', socket.userId);
      
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
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
