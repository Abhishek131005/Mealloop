const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/ChatMessage');
const Donation = require('../models/Donation');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get total unread message count for user (must be before /:donationId route)
router.get('/unread-count', auth, async (req, res) => {
  try {
    const unreadCount = await ChatMessage.countDocuments({
      receiver: req.user.id,
      read: false
    });
    
    res.json({ unreadCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch unread count', details: err.message });
  }
});

// Get list of active chats for the user (donor: all their donations, volunteer: all claimed) with peer user populated
router.get('/active', auth, async (req, res) => {
  try {
    // Find all donations where the user is either donor or claimedBy, and status is 'Claimed' or 'Picked Up'
    const donations = await Donation.find({
      $or: [
        { donor: req.user.id },
        { claimedBy: req.user.id }
      ],
      status: { $in: ['Claimed', 'Picked Up'] }
    })
      .populate('donor', 'name email phone')
      .populate('claimedBy', 'name email phone')
      .sort({ updatedAt: -1 });

    // For each donation, determine the peer and get unread message count
    const activeChats = await Promise.all(donations.map(async donation => {
      let peer = null;
      if (donation.donor && donation.donor._id.equals(req.user.id) && donation.claimedBy) {
        peer = donation.claimedBy;
      } else if (donation.claimedBy && donation.claimedBy._id.equals(req.user.id)) {
        peer = donation.donor;
      }
      
      // Get unread message count for this donation
      const unreadCount = await ChatMessage.countDocuments({
        donation: donation._id,
        receiver: req.user.id,
        read: false
      });
      
      // Get last message
      const lastMessage = await ChatMessage.findOne({
        donation: donation._id
      })
        .sort({ timestamp: -1 })
        .populate('sender', 'name')
        .select('message timestamp sender type');
      
      return {
        donationId: donation._id,
        peer,
        status: donation.status,
        lastUpdated: donation.updatedAt,
        foodName: donation.title || donation.foodName,
        unreadCount,
        lastMessage
      };
    }));

    res.json(activeChats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch active chats', details: err.message });
  }
});

// Mark messages as read (must be before /:donationId route)
router.put('/mark-read/:donationId', auth, async (req, res) => {
  try {
    const { donationId } = req.params;
    
    // Verify user has access to this donation
    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ error: 'Donation not found' });
    }
    
    if (
      donation.donor.toString() !== req.user.id &&
      (!donation.claimedBy || donation.claimedBy.toString() !== req.user.id)
    ) {
      return res.status(403).json({ error: 'Not authorized for this chat' });
    }
    
    // Mark messages as read
    const result = await ChatMessage.updateMany(
      { 
        donation: donationId, 
        receiver: req.user.id, 
        read: false 
      },
      { 
        read: true, 
        readAt: new Date() 
      }
    );
    
    res.json({ message: 'Messages marked as read', modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark messages as read', details: err.message });
  }
});

// Get chat history for a donation (only donor or assigned volunteer can access)
router.get('/:donationId', auth, async (req, res) => {
  try {
    const { donationId } = req.params;
    
    // Validate donationId format
    if (!donationId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid donation ID format' });
    }
    
    // Populate donor and claimedBy for chat peer info
    const donation = await Donation.findById(donationId)
      .populate('donor', 'name email phone')
      .populate('claimedBy', 'name email phone');
      
    if (!donation) return res.status(404).json({ error: 'Donation not found' });
    
    if (
      donation.donor._id.toString() !== req.user.id &&
      (!donation.claimedBy || donation.claimedBy._id.toString() !== req.user.id)
    ) {
      return res.status(403).json({ error: 'Not authorized for this chat' });
    }
    
    const messages = await ChatMessage.find({ donation: donationId })
      .sort({ timestamp: 1 })
      .populate('sender', 'name email')
      .populate('receiver', 'name email');
      
    res.json({ messages, donation });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chat history', details: err.message });
  }
});

// Get list of active chats for the user (donor: all their donations, volunteer: all claimed)
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const asDonor = await Donation.find({ donor: userId }).select('_id title claimedBy');
    const asVolunteer = await Donation.find({ claimedBy: userId }).select('_id title donor');
    res.json({ asDonor, asVolunteer });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chat list', details: err.message });
  }
});

module.exports = router;
