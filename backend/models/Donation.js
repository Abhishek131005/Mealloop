const mongoose = require('mongoose');
const DonationSchema = new mongoose.Schema({
  title: String,
  quantity: String,
  pickupStart: String,
  pickupEnd: String,
  address: String,
  lat: Number,
  lng: Number,
  shelterAddress: String,
  shelterLat: Number,
  shelterLng: Number,
  photoUrl: String,
  status: { 
    type: String, 
    enum: ['Pending', 'Claimed', 'Picked Up', 'Delivered', 'Cancelled'],
    default: 'Pending' 
  },
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  claimedAt: { type: Date },
  pickedUpAt: { type: Date },
  deliveredAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Donation', DonationSchema);
