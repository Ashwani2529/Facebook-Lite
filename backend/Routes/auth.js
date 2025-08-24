const express = require('express');
const router = express.Router();

// Import middleware
const { authenticate, optionalAuth } = require('../middleware/auth/authenticate');
const { 
  validateUserRegistration, 
  validateUserLogin,
  validateParams 
} = require('../middleware/validation/validators');

// Import error handling utilities
const { catchAsync, sendResponse, AppError } = require('../middleware/errorHandler');

// Import configuration and utilities
const config = require('../config/constants');
const logger = require('../utils/logger');

// Import models
const User = require('../models/user');

// JWT utility
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

/**
 * @desc    Get API info
 * @route   GET /api/v1/auth
 * @access  Public
 */
router.get('/', (req, res) => {
  sendResponse.success(res, {
    version: '2.0.0',
    endpoints: {
      signup: 'POST /api/v1/auth/signup',
      signin: 'POST /api/v1/auth/signin',
      verify: 'GET /api/v1/auth/verify-token',
      forgotPassword: 'POST /api/v1/auth/forgot-password'
    }
  }, 'Facebook Lite Authentication API v2.0');
});

/**
 * @desc    Register new user
 * @route   POST /api/v1/auth/signup
 * @access  Public
 */
router.post('/signup', catchAsync(async (req, res, next) => {
  const { name, email, password, phone, dateOfBirth, gender, pic } = req.body;

  console.log('Signup attempt:', { name, email, phone, gender, dateOfBirth });

  // Basic validation
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Name, email and password are required'
    });
  }

  // Validate phone number if provided
  if (phone && phone.length < 10) {
    return res.status(400).json({
      success: false,
      error: 'Phone number must be at least 10 digits'
    });
  }

  // Validate age if dateOfBirth provided
  if (dateOfBirth) {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (age < 13 || (age === 13 && monthDiff < 0) || (age === 13 && monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return res.status(400).json({
        success: false,
        error: 'You must be at least 13 years old to create an account'
      });
    }
  }

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: 'User already exists with that email'
    });
  }

  // Create new user with all provided fields
  const userData = {
    name: name.trim(),
    email: email.toLowerCase(),
    password,
    phone: phone || '',
    dateOfBirth: dateOfBirth || null,
    gender: gender || '',
    pic: pic || config.defaults.userProfilePicture
  };

  const user = new User(userData);
  await user.save();

  // Remove password from response
  const userResponse = user.toPublicProfile();

  console.log('User registered successfully:', email, 'with additional fields:', { phone, gender, dateOfBirth });

  res.status(201).json({
    success: true,
    user: userResponse,
    message: 'Account created successfully'
  });
}));

/**
 * @desc    Test route 
 * @route   GET /api/v1/auth/test
 * @access  Public
 */
router.get('/test', (req, res) => {
  console.log('Test route hit');
  res.json({ success: true, message: 'Auth routes are working' });
});

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/v1/auth/signin
 * @access  Public
 */
router.post('/signin', catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email and password are required'
    });
  }

  // Find user
  const user = await User.findByEmail(email).select('+password');
  
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Invalid email or password'
    });
  }

  // Compare password
  const isPasswordValid = await user.comparePassword(password);
  
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      error: 'Invalid email or password'
    });
  }

  // Generate JWT token
  const token = jwt.sign(
    { _id: user._id },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  // Prepare user response
  const userResponse = user.toPublicProfile();

  console.log('Login successful for:', email);

  res.status(200).json({
    success: true,
    token,
    user: userResponse,
    message: 'Login successful'
  });
}));

/**
 * @desc    Verify JWT token and get user info
 * @route   GET /api/v1/auth/verify-token
 * @access  Private
 */
router.get('/verify-token', authenticate, catchAsync(async (req, res) => {
  const userResponse = req.user.toPublicProfile();

  sendResponse.success(res, {
    valid: true,
    user: userResponse
  }, 'Token is valid');
}));

/**
 * @desc    Get current user profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
router.get('/me', authenticate, catchAsync(async (req, res, next) => {
  console.log('GET /me route hit');
  console.log('User from auth:', req.user?.email);
  
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log('Fetched user profile for:', user.email);

    res.json({
      success: true,
      user: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch profile: ' + error.message
    });
  }
}));

/**
 * @desc    Update user profile
 * @route   PUT /api/v1/auth/me
 * @access  Private
 */
router.put('/me', authenticate, catchAsync(async (req, res, next) => {
  console.log('PUT /me route hit');
  console.log('Request body:', req.body);
  console.log('User from auth:', req.user?.email);
  
  const allowedUpdates = ['name', 'bio', 'location', 'website', 'pic', 'phone', 'dateOfBirth', 'gender', 'address', 'privacy', 'notifications'];
  const updates = {};

  // Filter allowed updates
  Object.keys(req.body).forEach(key => {
    if (allowedUpdates.includes(key) && req.body[key] !== undefined) {
      // Handle special case for pic field - convert "none" to empty string
      if (key === 'pic' && (req.body[key] === 'none' || req.body[key] === null)) {
        updates[key] = '';
      } else {
        updates[key] = req.body[key];
      }
    }
  });

  console.log('Filtered updates:', updates);

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No valid updates provided'
    });
  }

  try {
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log('Profile updated successfully for:', updatedUser.email);

    res.json({
      success: true,
      user: updatedUser,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update profile: ' + error.message
    });
  }
}));

/**
 * @desc    Change user password
 * @route   PUT /api/v1/auth/change-password
 * @access  Private
 */
router.put('/change-password', authenticate, catchAsync(async (req, res, next) => {
  console.log('PUT /change-password route hit');
  console.log('User from auth:', req.user?.email);
  
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      error: 'Current password and new password are required'
    });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'New password must be at least 6 characters long'
    });
  }
  
  try {
    // Find user with password field
    const user = await User.findById(req.user._id).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }
    
    // Set new password (will be hashed by pre-save middleware)
    user.password = newPassword;
    user.passwordChangedAt = new Date();
    await user.save();
    
    console.log('Password updated successfully for:', user.email);
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Password change error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to change password: ' + error.message
    });
  }
}));

/**
 * @desc    Logout user (invalidate token - placeholder for token blacklisting)
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
router.post('/logout', authenticate, catchAsync(async (req, res) => {
  // In a production app, you would add the token to a blacklist
  // For now, we'll just log the logout event
  
  logger.info('User logged out', {
    userId: req.user._id,
    ip: req.ip
  });

  sendResponse.success(res, null, config.messages.auth.LOGOUT_SUCCESS);
}));

/**
 * @desc    Request password reset (placeholder)
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
router.post('/forgot-password', catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError('Email is required', 400, 'EMAIL_REQUIRED'));
  }

  // Check if user exists
  const user = await User.findByEmail(email);
  
  // For security, always send the same response regardless of whether user exists
  sendResponse.success(res, null, 'If an account with that email exists, you will receive a password reset link.');

  // If user exists, log the request (in production, send actual email)
  if (user) {
    logger.info('Password reset requested', {
      userId: user._id,
      email: user.email,
      ip: req.ip
    });
  }
}));

/**
 * @desc    Protected route example
 * @route   GET /api/v1/auth/protected
 * @access  Private
 */
router.get('/protected', authenticate, catchAsync(async (req, res) => {
  sendResponse.success(res, {
    message: 'This is a protected route',
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email
    }
  }, 'Access granted to protected resource');
}));

module.exports = router;