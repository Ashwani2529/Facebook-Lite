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
  type: {
    type: String,
    enum: ['friend', 'chat'],
    default: 'friend'
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending'
  },
  message: {
    type: String,
    trim: true,
    maxlength: [200, 'Request message cannot exceed 200 characters']
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

// Compound index to prevent duplicate requests (considering type)
chatRequestSchema.index({ sender: 1, receiver: 1, type: 1 }, { unique: true });
chatRequestSchema.index({ receiver: 1, status: 1 });
chatRequestSchema.index({ sender: 1, status: 1 });

// Prevent duplicate requests between same users for same type
chatRequestSchema.statics.findExistingRequest = function(senderId, receiverId, type = 'friend') {
  return this.findOne({
    $or: [
      { sender: senderId, receiver: receiverId, type: type },
      { sender: receiverId, receiver: senderId, type: type }
    ]
  });
};

module.exports = mongoose.model('ChatRequest', chatRequestSchema); 