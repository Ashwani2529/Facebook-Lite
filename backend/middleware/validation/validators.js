const mongoose = require('mongoose');
const validator = require('validator');
const config = require('../../config/constants');
const logger = require('../../utils/logger');

/**
 * Generic validation middleware creator
 */
const createValidator = (validationRules) => {
  return (req, res, next) => {
    const errors = [];
    const warnings = [];

    // Sanitize input data
    const sanitizedBody = sanitizeInput(req.body);
    req.body = sanitizedBody;

    // Apply validation rules
    for (const rule of validationRules) {
      const result = rule(req.body, req.params, req.query);
      if (result.error) {
        errors.push(result.error);
      }
      if (result.warning) {
        warnings.push(result.warning);
      }
    }

    // Log validation issues
    if (errors.length > 0) {
      logger.warn('Validation errors', {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        errors,
        body: req.body
      });

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
        code: 'VALIDATION_ERROR'
      });
    }

    // Log warnings but continue
    if (warnings.length > 0) {
      logger.info('Validation warnings', {
        url: req.originalUrl,
        method: req.method,
        warnings
      });
    }

    next();
  };
};

/**
 * Sanitize input to prevent XSS and injection attacks
 */
const sanitizeInput = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Basic XSS prevention
      sanitized[key] = value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .trim();
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * Common validation rules
 */
const validationRules = {
  // Required field validation
  required: (field, message = null) => (body) => {
    if (!body[field] || (typeof body[field] === 'string' && body[field].trim() === '')) {
      return {
        error: message || `${field} is required`,
        field
      };
    }
    return {};
  },

  // Email validation
  email: (field = 'email') => (body) => {
    const email = body[field];
    if (email && !validator.isEmail(email)) {
      return {
        error: config.errors.validation.INVALID_EMAIL,
        field
      };
    }
    return {};
  },

  // String length validation
  stringLength: (field, min = 0, max = Infinity, message = null) => (body) => {
    const value = body[field];
    if (value && typeof value === 'string') {
      const length = value.trim().length;
      if (length < min || length > max) {
        return {
          error: message || `${field} must be between ${min} and ${max} characters`,
          field
        };
      }
    }
    return {};
  },

  // Password validation
  password: (field = 'password') => (body) => {
    const password = body[field];
    if (password) {
      if (password.length < config.security.passwordMinLength) {
        return {
          error: config.errors.validation.PASSWORD_TOO_SHORT,
          field
        };
      }
      
      // Additional password strength checks
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        return {
          warning: 'Password should contain at least one uppercase letter, one lowercase letter, and one number for better security',
          field
        };
      }
    }
    return {};
  },

  // MongoDB ObjectId validation
  objectId: (field) => (body, params) => {
    const value = body[field] || params[field];
    if (value && !mongoose.Types.ObjectId.isValid(value)) {
      return {
        error: config.errors.validation.INVALID_ID,
        field
      };
    }
    return {};
  },

  // URL validation
  url: (field) => (body) => {
    const url = body[field];
    if (url && !validator.isURL(url, { require_protocol: true })) {
      return {
        error: `${field} must be a valid URL`,
        field
      };
    }
    return {};
  },

  // Custom validation
  custom: (field, validatorFn, message) => (body) => {
    const value = body[field];
    if (value && !validatorFn(value)) {
      return {
        error: message || `${field} is invalid`,
        field
      };
    }
    return {};
  }
};

/**
 * Pre-defined validators for different endpoints
 */

// User registration validation
const validateUserRegistration = createValidator([
  validationRules.required('name', 'Name is required'),
  validationRules.required('email', 'Email is required'),
  validationRules.required('password', 'Password is required'),
  validationRules.email('email'),
  validationRules.stringLength('name', config.validation.user.nameMinLength, config.validation.user.nameMaxLength),
  validationRules.password('password'),
  validationRules.url('pic')
]);

// User login validation
const validateUserLogin = createValidator([
  validationRules.required('email', 'Email is required'),
  validationRules.required('password', 'Password is required'),
  validationRules.email('email')
]);

// Post creation validation
const validatePostCreation = createValidator([
  validationRules.required('body', 'Post content is required'),
  validationRules.required('photo', 'Post image is required'),
  validationRules.stringLength('body', config.validation.post.bodyMinLength, config.validation.post.bodyMaxLength),
  validationRules.url('photo')
]);

// Post comment validation
const validateComment = createValidator([
  validationRules.required('text', 'Comment text is required'),
  validationRules.required('postId', 'Post ID is required'),
  validationRules.stringLength('text', 1, config.validation.post.maxCommentLength),
  validationRules.objectId('postId')
]);

// User follow/unfollow validation
const validateUserFollow = createValidator([
  validationRules.required('followid', 'User ID is required'),
  validationRules.objectId('followid')
]);

const validateUserUnfollow = createValidator([
  validationRules.required('unfollowid', 'User ID is required'),
  validationRules.objectId('unfollowid')
]);

// Profile update validation
const validateProfileUpdate = createValidator([
  validationRules.url('pic'),
  validationRules.stringLength('name', config.validation.user.nameMinLength, config.validation.user.nameMaxLength)
]);

// Search validation
const validateSearch = createValidator([
  validationRules.required('query', 'Search query is required'),
  validationRules.stringLength('query', 1, 100)
]);

// Like/Unlike validation
const validateLikeAction = createValidator([
  validationRules.required('postId', 'Post ID is required'),
  validationRules.objectId('postId')
]);

// Parameter validation
const validateParams = (paramName, type = 'objectId') => {
  return (req, res, next) => {
    const value = req.params[paramName];
    
    if (!value) {
      return res.status(400).json({
        success: false,
        error: `${paramName} parameter is required`,
        code: 'MISSING_PARAM'
      });
    }

    if (type === 'objectId' && !mongoose.Types.ObjectId.isValid(value)) {
      return res.status(400).json({
        success: false,
        error: config.errors.validation.INVALID_ID,
        code: 'INVALID_PARAM'
      });
    }

    next();
  };
};

module.exports = {
  createValidator,
  validationRules,
  sanitizeInput,
  
  // Pre-defined validators
  validateUserRegistration,
  validateUserLogin,
  validatePostCreation,
  validateComment,
  validateUserFollow,
  validateUserUnfollow,
  validateProfileUpdate,
  validateSearch,
  validateLikeAction,
  validateParams
}; 