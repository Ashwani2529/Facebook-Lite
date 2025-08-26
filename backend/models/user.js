const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const config = require('../config/constants');

const { Schema } = mongoose;

const userSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [config.validation.user.nameMinLength, `Name must be at least ${config.validation.user.nameMinLength} characters long`],
    maxlength: [config.validation.user.nameMaxLength, `Name cannot exceed ${config.validation.user.nameMaxLength} characters`],
    validate: {
      validator: function(name) {
        return /^[a-zA-Z\s]+$/.test(name);
      },
      message: 'Name should only contain letters and spaces'
    }
  },

  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: [config.validation.user.emailMaxLength, `Email cannot exceed ${config.validation.user.emailMaxLength} characters`],
    validate: {
      validator: validator.isEmail,
      message: 'Please provide a valid email address'
    },
    index: true // Index for faster lookups
  },

  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [config.validation.user.passwordMinLength, `Password must be at least ${config.validation.user.passwordMinLength} characters long`],
    maxlength: [config.validation.user.passwordMaxLength, `Password cannot exceed ${config.validation.user.passwordMaxLength} characters`],
    select: false // Never select password by default
  },

  pic: {
    type: String,
    default: config.defaults.userProfilePicture,
    validate: {
      validator: function(url) {
        // Allow empty strings, null, undefined, default URL, or "none"
        if (!url || url === '' || url === config.defaults.userProfilePicture || url === 'none') return true;
        
        // For actual URLs, validate them
        return validator.isURL(url, { require_protocol: true });
      },
      message: 'Profile picture must be a valid URL'
    }
  },

  bio: {
    type: String,
    trim: true,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },

  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters'],
    default: ''
  },

  website: {
    type: String,
    trim: true,
    validate: {
      validator: function(url) {
        if (!url) return true;
        return validator.isURL(url, { require_protocol: true });
      },
      message: 'Website must be a valid URL'
    }
  },

  phone: {
    type: String,
    trim: true,
    maxlength: [20, 'Phone number cannot exceed 20 characters'],
    default: ''
  },

  dateOfBirth: {
    type: Date,
    default: null
  },

  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say', ''],
    default: ''
  },

  address: {
    type: String,
    trim: true,
    maxlength: [200, 'Address cannot exceed 200 characters'],
    default: ''
  },

  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  followers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],

  following: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Account status and verification
  isEmailVerified: {
    type: Boolean,
    default: false
  },

  isActive: {
    type: Boolean,
    default: true
  },

  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },

  // Security fields
  lastLogin: {
    type: Date,
    default: null
  },

  passwordChangedAt: {
    type: Date,
    default: Date.now
  },

  // Email verification
  emailVerificationToken: String,
  emailVerificationExpires: Date,

  // Password reset
  passwordResetToken: String,
  passwordResetExpires: Date,

  // Privacy settings
  privacy: {
    profileVisibility: {
      type: String,
      enum: ['public', 'friends', 'private'],
      default: 'public'
    },
    showEmail: {
      type: Boolean,
      default: false
    },
    allowMessagesFromNonFriends: {
      type: Boolean,
      default: true
    }
  },

  // Notification preferences
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    },
    posts: {
      type: Boolean,
      default: true
    },
    comments: {
      type: Boolean,
      default: true
    },
    follows: {
      type: Boolean,
      default: true
    }
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ name: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ followers: 1 });
userSchema.index({ following: 1 });
userSchema.index({ 'privacy.profileVisibility': 1 });

// Virtual fields
userSchema.virtual('followersCount').get(function() {
  return this.followers ? this.followers.length : 0;
});

userSchema.virtual('followingCount').get(function() {
  return this.following ? this.following.length : 0;
});

userSchema.virtual('fullName').get(function() {
  return this.name;
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) {
    throw new Error('User password not loaded');
  }
  return bcrypt.compare(candidatePassword, this.password);
};



userSchema.methods.follow = async function(userId) {
  if (this.following.includes(userId)) {
    throw new Error('Already following this user');
  }
  
  this.following.push(userId);
  await this.save();
  
  // Add this user to the other user's followers
  await mongoose.model('User').findByIdAndUpdate(userId, {
    $addToSet: { followers: this._id }
  });
  
  return this;
};

userSchema.methods.unfollow = async function(userId) {
  const index = this.following.indexOf(userId);
  if (index === -1) {
    throw new Error('Not following this user');
  }
  
  this.following.splice(index, 1);
  await this.save();
  
  // Remove this user from the other user's followers
  await mongoose.model('User').findByIdAndUpdate(userId, {
    $pull: { followers: this._id }
  });
  
  return this;
};

userSchema.methods.toPublicProfile = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordChangedAt;
  delete obj.emailVerificationToken;
  delete obj.emailVerificationExpires;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.__v;
  
  return obj;
};

// Static methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findActiveUsers = function() {
  return this.find({ isActive: true });
};

userSchema.statics.searchUsers = function(query, limit = 10) {
  const searchRegex = new RegExp(query, 'i');
  return this.find({
    $or: [
      { name: searchRegex },
      { email: searchRegex }
    ],
    isActive: true,
    'privacy.profileVisibility': { $ne: 'private' }
  })
  .select('name email pic bio location')
  .limit(limit);
};

// Pre-save middleware
userSchema.pre('save', async function(next) {
  // Hash password if it's modified
  if (this.isModified('password')) {
    try {
      this.password = await bcrypt.hash(this.password, config.security.bcryptSaltRounds);
      this.passwordChangedAt = new Date();
    } catch (error) {
      return next(error);
    }
  }
  
  // Update lastLogin if it's a login
  if (this.isNew) {
    this.lastLogin = new Date();
  }
  
  next();
});

// Pre-remove middleware (cascade delete related data)
userSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    // Remove user from other users' followers/following arrays
    await mongoose.model('User').updateMany(
      { $or: [{ followers: this._id }, { following: this._id }] },
      { $pull: { followers: this._id, following: this._id } }
    );
    
    // Delete user's posts
    await mongoose.model('Post').deleteMany({ postedBy: this._id });
    
    next();
  } catch (error) {
    next(error);
  }
});

// Export the model
const User = mongoose.model('User', userSchema);
module.exports = User;