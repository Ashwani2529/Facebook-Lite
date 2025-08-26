const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const FriendRequest = mongoose.model('FriendRequest');
const User = mongoose.model('User');
const Notification = mongoose.model('Notification');
const { authenticate } = require('../middleware/auth/authenticate');

// Send friend request
router.post('/send-request', authenticate, async (req, res) => {
  try {
    const { userId } = req.body;
    const senderId = req.user._id;

    if (senderId.toString() === userId.toString()) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    // Check if recipient exists
    const recipient = await User.findById(userId);
    if (!recipient) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if request already exists
    const existingRequest = await FriendRequest.findExistingRequest(senderId, userId);
    if (existingRequest) {
      return res.status(400).json({ error: 'Friend request already exists' });
    }

    // Create friend request
    const friendRequest = new FriendRequest({
      sender: senderId,
      recipient: userId
    });

    await friendRequest.save();

    // Create notification for recipient
    await Notification.createNotification({
      recipient: userId,
      sender: senderId,
      type: 'friend_request',
      message: `${req.user.name} sent you a friend request`,
      relatedChatRequest: friendRequest._id
    });

    res.status(201).json({
      success: true,
      message: 'Friend request sent successfully',
      status: 'sent'
    });
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

// Accept friend request
router.post('/accept-request', authenticate, async (req, res) => {
  try {
    const { userId } = req.body;
    const currentUserId = req.user._id;

    const friendRequest = await FriendRequest.findOne({
      sender: userId,
      recipient: currentUserId,
      status: 'pending'
    });

    if (!friendRequest) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    // Update friend request status
    friendRequest.status = 'accepted';
    friendRequest.respondedAt = new Date();
    await friendRequest.save();

    // Add each user to other's friends list
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { friends: userId }
    });

    await User.findByIdAndUpdate(userId, {
      $addToSet: { friends: currentUserId }
    });

    // Create notification for sender
    await Notification.createNotification({
      recipient: userId,
      sender: currentUserId,
      type: 'friend_accept',
      message: `${req.user.name} accepted your friend request`,
    });

    res.status(200).json({
      success: true,
      message: 'Friend request accepted',
      status: 'friends'
    });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    res.status(500).json({ error: 'Failed to accept friend request' });
  }
});

// Decline friend request
router.post('/decline-request', authenticate, async (req, res) => {
  try {
    const { userId } = req.body;
    const currentUserId = req.user._id;

    const friendRequest = await FriendRequest.findOne({
      sender: userId,
      recipient: currentUserId,
      status: 'pending'
    });

    if (!friendRequest) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    friendRequest.status = 'declined';
    friendRequest.respondedAt = new Date();
    await friendRequest.save();

    res.status(200).json({
      success: true,
      message: 'Friend request declined',
      status: 'none'
    });
  } catch (error) {
    console.error('Error declining friend request:', error);
    res.status(500).json({ error: 'Failed to decline friend request' });
  }
});

// Cancel friend request
router.delete('/cancel-request', authenticate, async (req, res) => {
  try {
    const { userId } = req.body;
    const senderId = req.user._id;

    const friendRequest = await FriendRequest.findOneAndDelete({
      sender: senderId,
      recipient: userId,
      status: 'pending'
    });

    if (!friendRequest) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Friend request cancelled',
      status: 'none'
    });
  } catch (error) {
    console.error('Error cancelling friend request:', error);
    res.status(500).json({ error: 'Failed to cancel friend request' });
  }
});

// Check friend request status
router.get('/status/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Check if already friends
    const currentUser = await User.findById(currentUserId);
    if (currentUser.friends && currentUser.friends.includes(userId)) {
      return res.status(200).json({ status: 'friends' });
    }

    // Check for pending request
    const sentRequest = await FriendRequest.findOne({
      sender: currentUserId,
      recipient: userId,
      status: 'pending'
    });

    if (sentRequest) {
      return res.status(200).json({ status: 'sent' });
    }

    const receivedRequest = await FriendRequest.findOne({
      sender: userId,
      recipient: currentUserId,
      status: 'pending'
    });

    if (receivedRequest) {
      return res.status(200).json({ status: 'received' });
    }

    res.status(200).json({ status: 'none' });
  } catch (error) {
    console.error('Error checking friend status:', error);
    res.status(500).json({ error: 'Failed to check friend status' });
  }
});

// Remove friend
router.delete('/remove-friend', authenticate, async (req, res) => {
  try {
    const { userId } = req.body;
    const currentUserId = req.user._id;

    // Remove from both users' friends lists
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { friends: userId }
    });

    await User.findByIdAndUpdate(userId, {
      $pull: { friends: currentUserId }
    });

    // Remove accepted friend request
    await FriendRequest.findOneAndDelete({
      $or: [
        { sender: currentUserId, recipient: userId, status: 'accepted' },
        { sender: userId, recipient: currentUserId, status: 'accepted' }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Friend removed successfully',
      status: 'none'
    });
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ error: 'Failed to remove friend' });
  }
});

module.exports = router; 