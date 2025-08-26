const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth/authenticate');
const ChatRequest = require('../models/chatRequest');
const { Chat, Message } = require('../models/chat');
const User = require('../models/user');
const Notification = require('../models/notification');

// Send chat request
router.post('/request', authenticate, async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    const senderId = req.user._id;

    if (senderId.toString() === receiverId) {
      return res.status(400).json({ error: "You cannot send a chat request to yourself" });
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check for existing request
    const existingRequest = await ChatRequest.findExistingRequest(senderId, receiverId);
    if (existingRequest) {
      return res.status(400).json({ 
        error: "Chat request already exists", 
        status: existingRequest.status 
      });
    }

    const chatRequest = new ChatRequest({
      sender: senderId,
      receiver: receiverId,
      message: message || ''
    });

    await chatRequest.save();
    await chatRequest.populate('sender', 'name pic email');
    await chatRequest.populate('receiver', 'name pic email');

    // Create notification for the receiver
    await Notification.createNotification({
      recipient: receiverId,
      sender: senderId,
      type: 'chat_request',
      message: `${req.user.name} sent you a chat request`,
      relatedChatRequest: chatRequest._id
    });

    res.json({ 
      success: true, 
      message: "Chat request sent successfully",
      chatRequest 
    });
  } catch (error) {
    console.error('Send chat request error:', error);
    res.status(500).json({ error: "Failed to send chat request" });
  }
});

// Get received chat requests
router.get('/requests/received', authenticate, async (req, res) => {
  try {
    const requests = await ChatRequest.find({ 
      receiver: req.user._id,
      status: 'pending'
    })
    .populate('sender', 'name pic email')
    .sort({ createdAt: -1 });

    res.json({ success: true, requests });
  } catch (error) {
    console.error('Get received requests error:', error);
    res.status(500).json({ error: "Failed to fetch chat requests" });
  }
});

// Get sent chat requests
router.get('/requests/sent', authenticate, async (req, res) => {
  try {
    const requests = await ChatRequest.find({ 
      sender: req.user._id 
    })
    .populate('receiver', 'name pic email')
    .sort({ createdAt: -1 });

    res.json({ success: true, requests });
  } catch (error) {
    console.error('Get sent requests error:', error);
    res.status(500).json({ error: "Failed to fetch sent requests" });
  }
});

// Respond to chat request
router.put('/request/:requestId/respond', authenticate, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body; // 'accept' or 'decline'
    
    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({ error: "Invalid action. Use 'accept' or 'decline'" });
    }

    const chatRequest = await ChatRequest.findById(requestId);
    if (!chatRequest) {
      return res.status(404).json({ error: "Chat request not found" });
    }

    if (chatRequest.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "You can only respond to requests sent to you" });
    }

    if (chatRequest.status !== 'pending') {
      return res.status(400).json({ error: "This request has already been responded to" });
    }

    chatRequest.status = action === 'accept' ? 'accepted' : 'declined';
    chatRequest.respondedAt = new Date();
    await chatRequest.save();

    // If accepted, create chat
    let chat = null;
    if (action === 'accept') {
      chat = await Chat.findOrCreateChat(chatRequest.sender, chatRequest.receiver);
    }

    await chatRequest.populate('sender', 'name pic email');

    res.json({ 
      success: true, 
      message: `Chat request ${action}ed successfully`,
      chatRequest,
      chat
    });
  } catch (error) {
    console.error('Respond to chat request error:', error);
    res.status(500).json({ error: "Failed to respond to chat request" });
  }
});

// Find or create chat between two users
router.post('/find-or-create', authenticate, async (req, res) => {
  try {
    const { userId } = req.body;
    const currentUserId = req.user._id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (currentUserId.toString() === userId.toString()) {
      return res.status(400).json({ error: 'Cannot create chat with yourself' });
    }

    // Check if user exists
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Try to find existing chat
    let chat = await Chat.findOne({
      participants: { $all: [currentUserId, userId], $size: 2 }
    }).populate('participants', '_id name email pic');

    if (!chat) {
      // Create new chat
      chat = new Chat({
        participants: [currentUserId, userId]
      });
      await chat.save();
      
      // Populate participants
      chat = await Chat.findById(chat._id)
        .populate('participants', '_id name email pic');
    }

    res.status(200).json({
      success: true,
      chatId: chat._id,
      chat: chat
    });
  } catch (error) {
    console.error('Error finding/creating chat:', error);
    res.status(500).json({ error: 'Failed to find or create chat' });
  }
});

// Get user's chats
router.get('/chats', authenticate, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id,
      isActive: true
    })
    .populate('participants', 'name pic email')
    .populate({
      path: 'lastMessage',
      populate: {
        path: 'sender',
        select: 'name'
      }
    })
    .sort({ lastActivity: -1 });

    res.json({ success: true, chats });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ error: "Failed to fetch chats" });
  }
});

// Get chat messages
router.get('/chat/:chatId/messages', authenticate, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is participant
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    if (!chat.participants.includes(req.user._id)) {
      return res.status(403).json({ error: "You are not a participant in this chat" });
    }

    const messages = await Message.find({
      chat: chatId,
      isDeleted: false
    })
    .populate('sender', 'name pic')
    .populate('replyTo')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    // Mark messages as read
    await Message.updateMany(
      {
        chat: chatId,
        receiver: req.user._id,
        readStatus: { $ne: 'read' }
      },
      {
        readStatus: 'read',
        readAt: new Date()
      }
    );

    res.json({ success: true, messages: messages.reverse() });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Send message
router.post('/chat/:chatId/message', authenticate, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, messageType = 'text', replyTo } = req.body;
    console.log(req.body);

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Message content is required" });
    }

    // Verify chat exists and user is participant
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    if (!chat.participants.includes(req.user._id)) {
      return res.status(403).json({ error: "You are not a participant in this chat" });
    }

    // Find receiver
    const receiverId = chat.participants.find(p => p.toString() !== req.user._id.toString());

    const message = new Message({
      chat: chatId,
      sender: req.user._id,
      receiver: receiverId,
      content: content.trim(),
      messageType,
      replyTo
    });

    await message.save();
    await message.populate('sender', 'name pic');

    // Update chat's last message and activity
    chat.lastMessage = message._id;
    await chat.updateLastActivity();

    // Emit the message to all participants in the chat room via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(chatId).emit('new_message', {
        message: message,
        chatId: chatId
      });
      console.log(`📨 Message sent to chat room: ${chatId}`);
    }

    res.json({ success: true, message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Check chat request status
router.get('/request-status/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const existingRequest = await ChatRequest.findExistingRequest(req.user._id, userId);
    
    if (!existingRequest) {
      return res.json({ status: null });
    }

    res.json({ 
      status: existingRequest.status,
      requestId: existingRequest._id,
      isSender: existingRequest.sender.toString() === req.user._id.toString()
    });
  } catch (error) {
    console.error('Check request status error:', error);
    res.status(500).json({ error: "Failed to check request status" });
  }
});

module.exports = router; 