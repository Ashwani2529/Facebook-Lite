const mongoose = require('mongoose');

const friendRequestSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending'
  },
  message: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: {
    type: Date
  }
});

// Compound index to prevent duplicate requests
friendRequestSchema.index({ sender: 1, recipient: 1 }, { unique: true });

// Static method to find existing request
friendRequestSchema.statics.findExistingRequest = function(senderId, recipientId) {
  return this.findOne({
    $or: [
      { sender: senderId, recipient: recipientId },
      { sender: recipientId, recipient: senderId }
    ]
  });
};

module.exports = mongoose.model('FriendRequest', friendRequestSchema); 