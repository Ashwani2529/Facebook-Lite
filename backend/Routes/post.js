const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const {v2: cloudinary} = require('cloudinary');
const Post = mongoose.model('Post')
const User = mongoose.model('User')
const Notification = mongoose.model('Notification')
const login = require('../middleware/login')
const {authenticate} = require('../middleware/auth/authenticate')
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
// Create post endpoint
router.post('/createpost', login, async (req, res) => {
    try {
      const { photo, body } = req.body;
  
      if (!photo || !body) {
        return res.status(400).json({ error: 'Please add all the fields' });
      }
  
      req.user.password = undefined;
  
      const post = new Post({
        body,
        photo,
        postedBy: req.user
      });
  
      await post.save();
  
      const populatedPost = await Post.findById(post._id)
        .populate('postedBy', '_id name email pic');
  
      // Create notifications for all followers
      const user = await User.findById(req.user._id);
      if (user.followers && user.followers.length > 0) {
        const notificationPromises = user.followers.map(followerId => 
          Notification.createNotification({
            recipient: followerId,
            sender: req.user._id,
            type: 'new_post',
            message: `${req.user.name} shared a new post`,
            relatedPost: populatedPost._id
          })
        );
        await Promise.all(notificationPromises);
      }
  
      res.json({ post: populatedPost });
    } catch (err) {
      console.error('Error creating post:', err);
      res.status(500).json({ error: 'Failed to create post' });
    }
  });
  
// Get all posts with better population for modern UI
router.get('/allpost', login, async (req, res) => {
    try {
      const { page = 1, limit = 30 } = req.query;
      const skip = (page - 1) * limit;

      const posts = await Post.find()
        .populate('postedBy', '_id name email pic')
        .populate('comments.postedBy', '_id name email pic')
        .sort('-createdAt')
        .limit(parseInt(limit))
        .skip(skip);

      const totalPosts = await Post.countDocuments();
      const hasMore = skip + posts.length < totalPosts;
  
      res.json({ 
        posts, 
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalPosts / limit),
          hasMore,
          totalPosts
        }
      });
    } catch (err) {
      console.error('Error fetching posts:', err);
      res.status(500).json({ error: 'Failed to fetch posts' });
    }
  });
  

// Get subscribed posts
router.get('/getsubpost', login, async (req, res) => {
    try {
      const { page = 1, limit = 30 } = req.query;
      const skip = (page - 1) * limit;

      const posts = await Post.find({ postedBy: { $in: req.user.following } })
        .populate('postedBy', '_id name email pic')
        .populate('comments.postedBy', '_id name email pic')
        .sort('-createdAt')
        .limit(parseInt(limit))
        .skip(skip);

      const totalPosts = await Post.countDocuments({ postedBy: { $in: req.user.following } });
      const hasMore = skip + posts.length < totalPosts;
  
      res.json({ 
        posts, 
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalPosts / limit),
          hasMore,
          totalPosts
        }
      });
    } catch (err) {
      console.error('Error fetching subscribed posts:', err);
      res.status(500).json({ error: 'Failed to fetch subscribed posts' });
    }
  });
  
// Get user's own posts
router.get('/mypost', login, async (req, res) => {
    try {
      const myPosts = await Post.find({ postedBy: req.user._id })
        .populate('postedBy', '_id name email pic')
        .populate('comments.postedBy', '_id name email pic')
        .sort('-createdAt');
  
      res.json({ posts: myPosts });
    } catch (err) {
      console.error('Error fetching your posts:', err);
      res.status(500).json({ error: 'Failed to fetch your posts' });
    }
  });
  
// Like post with better response
router.put('/like', login, async (req, res) => {
    try {
      const { postId } = req.body;  
      if (!postId) {
        return res.status(400).json({ error: 'postId is required' });
      }
  
      const updatedPost = await Post.findByIdAndUpdate(
        postId,
        { $push: { likes: req.user._id } },
        { new: true }
      )
        .populate('postedBy', '_id name email pic')
        .populate('comments.postedBy', '_id name email pic');
  
      if (!updatedPost) {
        return res.status(404).json({ error: 'Post not found' });
      }
  
      res.json(updatedPost);
    } catch (err) {
      console.error('Error liking post:', err);
      res.status(500).json({ error: 'Failed to like post' });
    }
  });
  

// Unlike post with better response
router.put('/unlike', login, async (req, res) => {
    try {
      const { postId } = req.body;
  
      if (!postId) {
        return res.status(400).json({ error: 'postId is required' });
      }
  
      const updatedPost = await Post.findByIdAndUpdate(
        postId,
        { $pull: { likes: req.user._id } },
        { new: true }
      )
        .populate('postedBy', '_id name email pic')
        .populate('comments.postedBy', '_id name email pic');
  
      if (!updatedPost) {
        return res.status(404).json({ error: 'Post not found' });
      }
  
      // Create notification for post owner
      await Notification.createNotification({
        recipient: updatedPost.postedBy._id,
        sender: req.user._id,
        type: 'like',
        message: `${req.user.name} liked your post`,
        relatedPost: updatedPost._id
      });
  
      res.json(updatedPost);
    } catch (err) {
      console.error('Error unliking post:', err);
      res.status(500).json({ error: 'Failed to unlike post' });
    }
  });
  router.put('/comment', login, async (req, res) => {
    try {
      const { text, postId } = req.body;
  
      if (!text || !text.trim()) {
        return res.status(400).json({ error: 'Comment text is required' });
      }
      if (!postId) {
        return res.status(400).json({ error: 'postId is required' });
      }
  
      const comment = {
        text: text.trim(),
        postedBy: req.user._id
      };
  
      const updatedPost = await Post.findByIdAndUpdate(
        postId,
        { $push: { comments: comment } },
        { new: true }
      )
        .populate('postedBy', '_id name email pic')
        .populate('comments.postedBy', '_id name email pic');
  
      if (!updatedPost) {
        return res.status(404).json({ error: 'Post not found' });
      }
  
      // Create notification for post owner
      await Notification.createNotification({
        recipient: updatedPost.postedBy._id,
        sender: req.user._id,
        type: 'comment',
        message: `${req.user.name} commented on your post`,
        relatedPost: updatedPost._id
      });

      // Emit real-time comment update via Socket.IO
      const io = req.app.get('io');
      if (io) {
        io.emit('new_comment', {
          postId: postId,
          comment: {
            text: text.trim(),
            postedBy: {
              _id: req.user._id,
              name: req.user.name,
              email: req.user.email,
              pic: req.user.pic
            },
            _id: updatedPost.comments[updatedPost.comments.length - 1]._id
          },
          post: updatedPost
        });
        console.log(`📝 Comment broadcasted for post: ${postId}`);
      }
  
      res.json(updatedPost);
    } catch (err) {
      console.error('Error adding comment:', err);
      res.status(500).json({ error: 'Failed to add comment' });
    }
  });
    
router.delete('/deletepost/:postId', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId).populate('postedBy', '_id');

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // 🔑 Extract Cloudinary public_id
    if (post.photo) {
      const parts = post.photo.split('/');
      const filename = parts[parts.length - 1]; // e.g. abc123.jpg
      const publicId = filename.split('.')[0];  // e.g. abc123

      await cloudinary.uploader.destroy(publicId, { invalidate: true });
    }

    await post.deleteOne();

    res.json({ message: 'Post deleted successfully', postId: req.params.postId });
  } catch (err) {
    console.error('Error deleting post:', err);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Get individual post by ID
router.get('/post/:postId', authenticate, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId)
      .populate('postedBy', '_id name email pic followers following')
      .populate({
        path: 'comments.postedBy',
        select: '_id name email pic'
      })
      .lean();

    if (!post) {
      return res.status(404).json({
        error: 'Post not found'
      });
    }

    res.status(200).json({
      success: true,
      post: post
    });
  } catch (error) {
    console.error('Error fetching individual post:', error);
    res.status(500).json({
      error: 'Server error while fetching post'
    });
  }
});

// Update post caption
router.put('/updatepost/:postId', authenticate, async (req, res) => {
  try {
    const { postId } = req.params;
    const { body } = req.body;
    const userId = req.user._id;

    // Find the post and check if user owns it
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({
        error: 'Post not found'
      });
    }

    if (post.postedBy.toString() !== userId.toString()) {
      return res.status(403).json({
        error: 'Unauthorized to update this post'
      });
    }

    // Update the post
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { body: body },
      { new: true, runValidators: true }
    ).populate('postedBy', '_id name email pic');

    res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      post: updatedPost
    });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({
      error: 'Server error while updating post'
    });
  }
});
  
module.exports = router