const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Post = mongoose.model('Post');
const login = require('../middleware/login');
const User = mongoose.model("User");
const Notification = require('../models/notification'); 
const {authenticate} = require('../middleware/auth/authenticate'); // Added for delete account

// Get user profile with posts
router.get('/user/:id', login, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id }).select("-password");
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        const posts = await Post.find({ postedBy: req.params.id })
            .populate("postedBy", "_id name email pic")
            .populate('comments.postedBy', '_id name email pic')
            .sort("-createdAt");
            
        res.json({ user, posts });
    } catch (err) {
        console.log('User profile error:', err);
        return res.status(500).json({ error: "Internal server error" });
    }
})

// Follow user with better error handling
router.put('/follow', login, async (req, res) => {
    try {
        const { followid } = req.body;
        console.log('Follow request:', { followid, userId: req.user._id });
        
        if (!followid) {
            return res.status(422).json({ error: "User ID is required" });
        }
        
        if (followid === req.user._id.toString()) {
            return res.status(422).json({ error: "You cannot follow yourself" });
        }

        // Add current user to target user's followers
        const targetUser = await User.findByIdAndUpdate(followid, {
            $push: { followers: req.user._id }
        }, { new: true });

        if (!targetUser) {
            return res.status(404).json({ error: "User not found" });
        }
        
        // Add target user to current user's following
        const updatedUser = await User.findByIdAndUpdate(req.user._id, {
            $push: { following: followid }
        }, { new: true }).select("-password");

        // Create notification for the followed user (non-blocking)
        try {
            await Notification.createNotification({
                recipient: followid,
                sender: req.user._id,
                type: 'follow',
                message: `${req.user.name} started following you`
            });
            console.log('Follow notification created successfully');
        } catch (notifError) {
            console.log('Notification creation failed (non-critical):', notifError);
            // Don't fail the follow action if notification fails
        }

        console.log('Follow successful');
        res.json({ success: true, user: updatedUser });
    } catch (err) {
        console.error('Follow error details:', {
            error: err.message,
            stack: err.stack,
            followid: req.body.followid,
            userId: req.user._id
        });
        return res.status(500).json({ 
            error: "Failed to follow user", 
            details: err.message 
        });
    }
})

// Unfollow user with better error handling  
router.put('/unfollow', login, async (req, res) => {
        const { unfollowid } = req.body;
    
    if (!unfollowid) {
        return res.status(422).json({ error: "User ID is required" });
    }
    
    if (unfollowid === req.user._id.toString()) {
        return res.status(422).json({ error: "You cannot unfollow yourself" });
    }

    try {
        console.log('Unfollow request:', { unfollowid, userId: req.user._id });

        // Remove current user from target user's followers
        const targetUser = await User.findByIdAndUpdate(unfollowid, {
            $pull: { followers: req.user._id }
        }, { new: true });

        if (!targetUser) {
            return res.status(404).json({ error: "User not found" });
        }
        
        // Remove target user from current user's following
        const updatedUser = await User.findByIdAndUpdate(req.user._id, {
            $pull: { following: unfollowid }
        }, { new: true }).select("-password");

                console.log('Unfollow successful');
        res.json({ success: true, user: updatedUser });
    } catch (err) {
        console.log('Unfollow error:', err);
        return res.status(500).json({ error: "Failed to unfollow user" });
    }
});

// Update profile picture
router.put('/updatepic', login, (req, res) => {
    const { pic } = req.body;
    
    if (!pic) {
        return res.status(422).json({ error: "Profile picture URL is required" });
    }

    User.findByIdAndUpdate(req.user._id, { $set: { pic: pic } }, { new: true })
        .select("-password")
        .then(result => {
            if (!result) {
                return res.status(404).json({ error: "User not found" });
            }
            res.json({ message: "Profile picture updated successfully", user: result })
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ error: "Failed to update profile picture" })
        })
})

// Search users with enhanced data for modern UI
router.post('/search-users', (req, res) => {
    const { query } = req.body;
    
    if (!query || !query.trim()) {
        return res.status(422).json({ error: "Search query is required" });
    }
    
    let userPattern = new RegExp(query.trim(), "i"); // Search anywhere in the name, case insensitive
    User.find({ name: { $regex: userPattern } })
        .select("_id name email pic") // Include email and pic for modern UI
        .limit(10) // Limit results for performance
        .then(user => {
            res.json({ user })
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ error: "Failed to search users" })
        })
})

// Get user's followers
router.get('/followers/:userId', login, (req, res) => {
    User.findById(req.params.userId)
        .populate('followers', '_id name email pic')
        .select('followers')
        .then(result => {
            if (!result) {
                return res.status(404).json({ error: "User not found" });
            }
            res.json({ followers: result.followers })
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ error: "Failed to fetch followers" })
        })
})

// Get user's following
router.get('/following/:userId', login, (req, res) => {
    User.findById(req.params.userId)
        .populate('following', '_id name email pic')
        .select('following')
        .then(result => {
            if (!result) {
                return res.status(404).json({ error: "User not found" });
            }
            res.json({ following: result.following })
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ error: "Failed to fetch following" })
        })
})

// Delete account
router.delete('/delete-account', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;

    // Delete all posts by the user
    await Post.deleteMany({ postedBy: userId });

    // Remove user from all followers/following lists
    await User.updateMany(
      { $or: [{ followers: userId }, { following: userId }] },
      { $pull: { followers: userId, following: userId } }
    );

    // Remove user from friends lists
    await User.updateMany(
      { friends: userId },
      { $pull: { friends: userId } }
    );

    // Delete all requests (friend and chat)
    await mongoose.model('ChatRequest').deleteMany({
      $or: [{ sender: userId }, { receiver: userId }]
    });

    // Delete all chats where user is a participant
    const chats = await mongoose.model('Chat').find({
      participants: userId
    });

    for (let chat of chats) {
      // Delete all messages in the chat
      await mongoose.model('Message').deleteMany({ chat: chat._id });
      // Delete the chat
      await mongoose.model('Chat').findByIdAndDelete(chat._id);
    }

    // Delete all notifications related to the user
    await mongoose.model('Notification').deleteMany({
      $or: [{ recipient: userId }, { sender: userId }]
    });

    // Finally, delete the user account
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({
      error: 'Failed to delete account'
    });
  }
});

module.exports = router