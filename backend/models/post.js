const mongoose = require('mongoose');
const validator = require('validator');
const config = require('../config/constants');

const { Schema } = mongoose;

// Comment sub-schema
const commentSchema = new Schema({
  text: {
    type: String,
    required: [true, 'Comment text is required'],
    trim: true,
    minlength: [1, 'Comment cannot be empty'],
    maxlength: [config.validation.post.maxCommentLength, `Comment cannot exceed ${config.validation.post.maxCommentLength} characters`],
    validate: {
      validator: function(text) {
        // Basic profanity filter (can be enhanced)
        const profanityPattern = /\b(spam|fake|scam)\b/gi;
        return !profanityPattern.test(text);
      },
      message: 'Comment contains inappropriate content'
    }
  },
  
  postedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Comment author is required']
  },
  
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  replies: [{
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: [config.validation.post.maxCommentLength, `Reply cannot exceed ${config.validation.post.maxCommentLength} characters`]
    },
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  isEdited: {
    type: Boolean,
    default: false
  },
  
  editHistory: [{
    originalText: String,
    editedAt: Date
  }]
}, {
  timestamps: true
});

// Main Post Schema
const postSchema = new Schema({
  body: {
    type: String,
    required: [true, 'Post content is required'],
    trim: true,
    minlength: [config.validation.post.bodyMinLength, `Post must be at least ${config.validation.post.bodyMinLength} character long`],
    maxlength: [config.validation.post.bodyMaxLength, `Post cannot exceed ${config.validation.post.bodyMaxLength} characters`],
    validate: {
      validator: function(body) {
        // Basic content validation (no excessive special characters)
        const specialCharPattern = /[!@#$%^&*(),.?":{}|<>]{10,}/g;
        return !specialCharPattern.test(body);
      },
      message: 'Post contains too many special characters'
    }
  },

  photo: {
    type: String,
    required: [true, 'Post image is required'],
    validate: {
      validator: function(url) {
        return validator.isURL(url, { require_protocol: true });
      },
      message: 'Photo must be a valid URL'
    }
  },

  postedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Post author is required'],
    index: true // Index for faster user post queries
  },

  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],

  comments: [commentSchema],

  // Post metadata
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],

  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },

  // Content moderation
  isReported: {
    type: Boolean,
    default: false
  },

  reports: [{
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['spam', 'harassment', 'inappropriate', 'copyright', 'other']
    },
    description: String,
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }],

  isHidden: {
    type: Boolean,
    default: false
  },

  moderationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'approved'
  },

  // Post analytics
  views: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],

  shares: [{
    sharedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Post type and visibility
  type: {
    type: String,
    enum: ['photo', 'video', 'text', 'link'],
    default: 'photo'
  },

  visibility: {
    type: String,
    enum: ['public', 'friends', 'private'],
    default: 'public'
  },

  // Edit tracking
  isEdited: {
    type: Boolean,
    default: false
  },

  editHistory: [{
    originalBody: String,
    originalPhoto: String,
    editedAt: Date
  }],

  // Engagement metrics (computed fields)
  engagement: {
    score: {
      type: Number,
      default: 0
    },
    lastCalculated: {
      type: Date,
      default: Date.now
    }
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
postSchema.index({ postedBy: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ likes: 1 });
postSchema.index({ tags: 1 });
postSchema.index({ visibility: 1 });
postSchema.index({ moderationStatus: 1 });
postSchema.index({ 'engagement.score': -1 });

// Compound indexes
postSchema.index({ postedBy: 1, visibility: 1, createdAt: -1 });
postSchema.index({ visibility: 1, moderationStatus: 1, createdAt: -1 });

// Virtual fields
postSchema.virtual('likesCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

postSchema.virtual('commentsCount').get(function() {
  return this.comments ? this.comments.length : 0;
});

postSchema.virtual('viewsCount').get(function() {
  return this.views ? this.views.length : 0;
});

postSchema.virtual('sharesCount').get(function() {
  return this.shares ? this.shares.length : 0;
});

postSchema.virtual('totalEngagement').get(function() {
  return this.likesCount + this.commentsCount + this.viewsCount + (this.sharesCount * 2);
});

postSchema.virtual('isPopular').get(function() {
  return this.totalEngagement > 50; // Configurable threshold
});

// Instance methods
postSchema.methods.addLike = async function(userId) {
  if (this.likes.includes(userId)) {
    throw new Error('User already liked this post');
  }
  
  this.likes.push(userId);
  await this.updateEngagementScore();
  return this.save();
};

postSchema.methods.removeLike = async function(userId) {
  const index = this.likes.indexOf(userId);
  if (index === -1) {
    throw new Error('User has not liked this post');
  }
  
  this.likes.splice(index, 1);
  await this.updateEngagementScore();
  return this.save();
};

postSchema.methods.addComment = async function(commentData) {
  this.comments.push(commentData);
  await this.updateEngagementScore();
  return this.save();
};

postSchema.methods.addView = async function(userId) {
  // Avoid duplicate views from the same user
  const existingView = this.views.find(view => 
    view.user && view.user.toString() === userId.toString()
  );
  
  if (!existingView) {
    this.views.push({ user: userId });
    await this.updateEngagementScore();
    return this.save();
  }
  
  return this;
};

postSchema.methods.reportPost = async function(reportData) {
  this.reports.push(reportData);
  this.isReported = true;
  
  // Auto-flag if multiple reports
  if (this.reports.length >= 3) {
    this.moderationStatus = 'flagged';
  }
  
  return this.save();
};

postSchema.methods.updateEngagementScore = async function() {
  const now = new Date();
  const ageInHours = (now - this.createdAt) / (1000 * 60 * 60);
  
  // Engagement score formula (can be customized)
  const likesWeight = 1;
  const commentsWeight = 2;
  const viewsWeight = 0.1;
  const sharesWeight = 3;
  const timeDecay = Math.max(0.1, 1 - (ageInHours / 168)); // Decay over a week
  
  const score = (
    (this.likesCount * likesWeight) +
    (this.commentsCount * commentsWeight) +
    (this.viewsCount * viewsWeight) +
    (this.sharesCount * sharesWeight)
  ) * timeDecay;
  
  this.engagement.score = Math.round(score);
  this.engagement.lastCalculated = now;
  
  return this;
};

postSchema.methods.canUserView = function(userId, userRelation = 'public') {
  // Public posts can be viewed by anyone
  if (this.visibility === 'public') return true;
  
  // Private posts only by owner
  if (this.visibility === 'private') {
    return this.postedBy.toString() === userId.toString();
  }
  
  // Friends posts by owner and friends
  if (this.visibility === 'friends') {
    return this.postedBy.toString() === userId.toString() || userRelation === 'friend';
  }
  
  return false;
};

postSchema.methods.toSafeObject = function(userId) {
  const obj = this.toObject();
  
  // Remove sensitive data
  delete obj.reports;
  delete obj.views;
  delete obj.editHistory;
  delete obj.__v;
  
  // Add user-specific data
  obj.isLikedByUser = this.likes.includes(userId);
  obj.isOwnPost = this.postedBy.toString() === userId.toString();
  
  return obj;
};

// Static methods
postSchema.statics.findPublicPosts = function(limit = 20, skip = 0) {
  return this.find({
    visibility: 'public',
    moderationStatus: 'approved',
    isHidden: false
  })
  .populate('postedBy', 'name email pic')
  .populate('comments.postedBy', 'name pic')
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip(skip);
};

postSchema.statics.findUserFeed = function(userId, followingIds, limit = 20, skip = 0) {
  return this.find({
    $or: [
      { postedBy: userId },
      {
        postedBy: { $in: followingIds },
        $or: [
          { visibility: 'public' },
          { visibility: 'friends' }
        ]
      }
    ],
    moderationStatus: 'approved',
    isHidden: false
  })
  .populate('postedBy', 'name email pic')
  .populate('comments.postedBy', 'name pic')
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip(skip);
};

postSchema.statics.findTrendingPosts = function(limit = 10) {
  return this.find({
    visibility: 'public',
    moderationStatus: 'approved',
    isHidden: false,
    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
  })
  .sort({ 'engagement.score': -1 })
  .limit(limit)
  .populate('postedBy', 'name pic');
};

postSchema.statics.searchPosts = function(query, userId, limit = 20) {
  const searchRegex = new RegExp(query, 'i');
  
  return this.find({
    $or: [
      { body: searchRegex },
      { tags: searchRegex }
    ],
    visibility: 'public',
    moderationStatus: 'approved',
    isHidden: false
  })
  .populate('postedBy', 'name pic')
  .sort({ createdAt: -1 })
  .limit(limit);
};

// Pre-save middleware
postSchema.pre('save', async function(next) {
  if (this.isModified('body') && !this.isNew) {
    // Track edit history
    this.editHistory.push({
      originalBody: this.body,
      originalPhoto: this.photo,
      editedAt: new Date()
    });
    this.isEdited = true;
  }
  
  // Auto-calculate engagement score
  if (this.isModified('likes') || this.isModified('comments') || this.isModified('views')) {
    await this.updateEngagementScore();
  }
  
  next();
});

// Pre-remove middleware
postSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    // Remove this post from any user's saved posts (if that feature exists)
    // This would be implemented when adding bookmark/save functionality
    next();
  } catch (error) {
    next(error);
  }
});

// Export the model
const Post = mongoose.model('Post', postSchema);
module.exports = Post;