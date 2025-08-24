const mongoose = require('mongoose');

const chatRequestSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
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
    trim: true,
    maxlength: [200, 'Chat request message cannot exceed 200 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
chatRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true });
chatRequestSchema.index({ receiver: 1, status: 1 });
chatRequestSchema.index({ sender: 1, status: 1 });

// Prevent duplicate chat requests between same users
chatRequestSchema.statics.findExistingRequest = function(senderId, receiverId) {
  return this.findOne({
    $or: [
      { sender: senderId, receiver: receiverId },
      { sender: receiverId, receiver: senderId }
    ]
  });
};

module.exports = mongoose.model('ChatRequest', chatRequestSchema); 