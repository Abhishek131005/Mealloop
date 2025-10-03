const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');

// GET all donations
router.get('/', async (req, res) => {
  const donations = await Donation.find()
    .populate('donor', 'name email phone')
    .populate('claimedBy', 'name email phone');
  res.json(donations);
});

// POST new donation
const auth = require('../middleware/auth');
router.post('/', auth, async (req, res) => {
  // Ensure donor field is set from logged-in user
  const donationData = { ...req.body };
  if (!donationData.donor) donationData.donor = req.user.id;
  const donation = new Donation(donationData);
  // User model for population
  const User = require('../models/User');
  await donation.save();
  res.status(201).json(donation);
});

// PATCH update donation
router.patch('/:id', auth, async (req, res) => {
  try {
    console.log('Updating donation with ID:', req.params.id);
    console.log('Update data:', req.body);
    
    // Ensure the donation belongs to the logged-in user
    const donation = await Donation.findOne({ _id: req.params.id, donor: req.user.id });
  router.get('/history', auth, async (req, res) => {
    try {
      // Find all donations by this user (as donor)
      const donations = await Donation.find({ donor: req.user.id })
        .populate('volunteer', 'name email')
        .populate('donor', 'name email')
        .sort({ createdAt: -1 });
      res.json(donations);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error fetching donation history' });
    }
  });
    
    if (!donation) {
      console.log('Donation not found or not authorized');
      return res.status(404).json({ 
        success: false, 
        message: 'Donation not found or you are not authorized to update it' 
      });
    }
    
    // Update only allowed fields
    const { title, quantity, pickupStart, pickupEnd, address, lat, lng, status } = req.body;
    
    if (title) donation.title = title;
    if (quantity) donation.quantity = quantity;
    if (pickupStart) donation.pickupStart = pickupStart;
    if (pickupEnd) donation.pickupEnd = pickupEnd;
    if (address) donation.address = address;
    if (lat) donation.lat = lat;
    if (lng) donation.lng = lng;
    if (status) donation.status = status;
    
    const updatedDonation = await donation.save();
    
    console.log('Successfully updated donation:', updatedDonation);
    res.json({
      success: true,
      data: updatedDonation
    });
    
  } catch (error) {
    console.error('Error updating donation:', {
      error: error.message,
      stack: error.stack,
      donationId: req.params.id,
      updateData: req.body
    });
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update donation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Claim a donation
router.post('/:id/claim', auth, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    
    if (!donation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Donation not found' 
      });
    }

    // Check if donation is already claimed
    if (donation.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Donation is not available for claiming'
      });
    }

    // Update the donation status
    donation.status = 'Claimed';
    donation.claimedBy = req.user.id;
    donation.claimedAt = new Date();
    
    await donation.save();
    
    // Populate the donor and claimedBy fields for the response
  await donation.populate('donor', 'name email phone');
  await donation.populate('claimedBy', 'name email phone');
    
    res.json({
      success: true,
      data: donation
    });
  } catch (error) {
    console.error('Error claiming donation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to claim donation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET delivered donations for volunteer
router.get('/delivered', auth, async (req, res) => {
  try {
    const donations = await Donation.find({ 
      claimedBy: req.user.id,
      status: 'Delivered' 
    })
    .populate('donor', 'name email phone')
    .populate('claimedBy', 'name email phone')
    .sort({ deliveredAt: -1 });
    res.json(donations);
  } catch (error) {
    console.error('Error fetching delivered donations:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching delivered donations',
      error: error.message 
    });
  }
});

// GET all donations for the logged-in user
router.get('/mine', auth, async (req, res) => {
  try {
    console.log('Fetching donations for user ID:', req.user.id);
    console.log('User object:', req.user);
    
    const donations = await Donation.find({ donor: req.user.id })
      .populate('donor', 'name email phone')
      .populate('claimedBy', 'name email phone')
      .sort({ createdAt: -1 });
      
    console.log('Found donations:', donations.length);
    console.log('Donations:', JSON.stringify(donations, null, 2));
    
    res.json(donations);
  } catch (error) {
    console.error('Error fetching user donations:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching your donations',
      error: error.message
    });
  }
});

// DELETE donation
router.delete('/:id', async (req, res) => {
  try {
    console.log('Attempting to delete donation with ID:', req.params.id);
    const result = await Donation.findByIdAndDelete(req.params.id);
    
    if (!result) {
      console.log('No donation found with ID:', req.params.id);
      return res.status(404).json({ 
        success: false, 
        message: 'Donation not found' 
      });
    }
    
    console.log('Successfully deleted donation:', result);
    res.json({ 
      success: true,
      message: 'Donation deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting donation:', {
      error: error.message,
      stack: error.stack,
      id: req.params.id
    });
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete donation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Mark donation as picked up
router.patch('/:id/pickup', auth, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    
    if (!donation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Donation not found' 
      });
    }

    // Check if the current user is the one who claimed the donation
    if (donation.claimedBy && donation.claimedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to mark this donation as picked up'
      });
    }

    // Check if donation is in the right status
    if (donation.status !== 'Claimed') {
      return res.status(400).json({
        success: false,
        message: `Cannot mark as picked up. Current status is ${donation.status}`
      });
    }

    // Update the donation status
    donation.status = 'Picked Up';
    donation.pickedUpAt = new Date();
    
    await donation.save();
    
    // Populate the donor and claimedBy fields for the response
  await donation.populate('donor', 'name email phone');
  await donation.populate('claimedBy', 'name email phone');
    
    // Emit WebSocket event if you have WebSocket setup
    // io.emit('donation_updated', { id: donation._id, status: 'Picked Up' });

    res.json({
      success: true,
      data: donation
    });
  } catch (error) {
    console.error('Error marking donation as picked up:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark donation as picked up',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Mark donation as delivered
router.patch('/:id/deliver', auth, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    
    if (!donation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Donation not found' 
      });
    }

    // Check if the current user is the one who claimed the donation
    if (donation.claimedBy && donation.claimedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to mark this donation as delivered'
      });
    }

    // Check if donation is in the right status
    if (donation.status !== 'Picked Up') {
      return res.status(400).json({
        success: false,
        message: `Cannot mark as delivered. Current status is ${donation.status}. The donation must be in 'Picked Up' status.`
      });
    }

    // Update the donation status
    donation.status = 'Delivered';
    donation.deliveredAt = new Date();
    
    await donation.save();
    
    // Populate the donor and claimedBy fields for the response
  await donation.populate('donor', 'name email phone');
  await donation.populate('claimedBy', 'name email phone');
    
    // Emit WebSocket event if you have WebSocket setup
    // io.emit('donation_updated', { id: donation._id, status: 'Delivered' });

    res.json({
      success: true,
      data: donation
    });
  } catch (error) {
    console.error('Error marking donation as delivered:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark donation as delivered',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
