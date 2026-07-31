const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  participantKey: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const messageSchema = new mongoose.Schema({
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
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
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: [4000, 'Message cannot exceed 4000 characters']
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
  },
  readStatus: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  readAt: {
    type: Date
  },
  editedAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
chatSchema.index({ participants: 1 });
chatSchema.index({ lastActivity: -1 });

messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, readStatus: 1 });

// Static method to find or create chat between two users
chatSchema.statics.findOrCreateChat = async function(user1Id, user2Id) {
  const participants = [user1Id.toString(), user2Id.toString()].sort();
  const participantKey = participants.join(':');
  let chat = await this.findOne({
    participants: { $all: participants, $size: 2 }
  });
  if (chat && !chat.participantKey) {
    chat.participantKey = participantKey;
    await chat.save();
  }
  if (!chat) chat = await this.findOneAndUpdate(
    { participantKey },
    {
      $setOnInsert: {
        participants,
        participantKey,
        lastActivity: new Date(),
        isActive: true
      }
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  await chat.populate('participants', 'name pic email');
  await chat.populate('lastMessage');
  return chat;
};

chatSchema.pre('save', function(next) {
  if (this.participants?.length === 2) {
    this.participantKey = this.participants.map(String).sort().join(':');
  }
  next();
});

// Method to update last activity
chatSchema.methods.updateLastActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

const Chat = mongoose.model('Chat', chatSchema);
const Message = mongoose.model('Message', messageSchema);

module.exports = { Chat, Message }; 
