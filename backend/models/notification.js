const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['like', 'comment', 'follow', 'chat_request', 'chat_message', 'new_post', 'friend_request'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  relatedChat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat'
  },
  relatedChatRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRequest'
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1 });
notificationSchema.index({ sender: 1, type: 1 });

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  const { recipient, sender, type, message, relatedPost, relatedChat, relatedChatRequest } = data;
  
  // Don't create notification if sender and recipient are the same
  if (sender.toString() === recipient.toString()) {
    return null;
  }

  // Check if similar notification already exists (to avoid duplicates)
  const existingNotification = await this.findOne({
    recipient,
    sender,
    type,
    relatedPost,
    relatedChat,
    relatedChatRequest,
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
  });

  if (existingNotification) {
    // Update the existing notification timestamp
    existingNotification.message = message;
    existingNotification.read = false;
    existingNotification.readAt = null;
    return await existingNotification.save();
  }

  // Create new notification
  const notification = new this({
    recipient,
    sender,
    type,
    message,
    relatedPost,
    relatedChat,
    relatedChatRequest
  });

  return await notification.save();
};

// Static method to mark notifications as read
notificationSchema.statics.markAsRead = async function(recipient, notificationIds = null) {
  const query = { recipient, read: false };
  
  if (notificationIds) {
    query._id = { $in: notificationIds };
  }

  return await this.updateMany(query, {
    read: true,
    readAt: new Date()
  });
};

module.exports = mongoose.model('Notification', notificationSchema); 