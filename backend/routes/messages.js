// routes/messages.js - HTTP fallback for messages
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ChatMessage = require('../models/ChatMessage');

// Send message via HTTP (fallback when socket fails)
router.post('/send', auth, async (req, res) => {
  try {
    const { donationId, receiver, message } = req.body;
    
    if (!donationId || !receiver || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Save to DB
    const chatMsg = new ChatMessage({
      donation: donationId,
      sender: req.user.id,
      receiver,
      message,
      delivered: false,
      read: false
    });
    
    await chatMsg.save();
    await chatMsg.populate('sender', 'name email');
    await chatMsg.populate('receiver', 'name email');
    
    res.json({ success: true, message: chatMsg });
  } catch (error) {
    console.error('HTTP message send error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;