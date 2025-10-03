const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  donation: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  delivered: { type: Boolean, default: false },
  read: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
  type: { type: String, enum: ['text', 'system'], default: 'text' },
  readAt: { type: Date },
  deliveredAt: { type: Date }
});

// Index for better query performance
ChatMessageSchema.index({ donation: 1, timestamp: 1 });
ChatMessageSchema.index({ receiver: 1, read: 1 });

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
