const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const config = require('../../config/constants');
const logger = require('../../utils/logger');

const User = mongoose.model('User');

/**
 * Authentication middleware - verifies JWT token and loads user
 */
const authenticate = async (req, res, next) => {
  try {
    const startTime = Date.now();
    const { authorization } = req.headers;

    // Check if authorization header exists
    if (!authorization || !authorization.startsWith('Bearer ')) {
      logger.logSecurity('Authentication attempted without valid token', {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        url: req.originalUrl
      });
      
      return res.status(401).json({ 
        success: false,
        error: config.errors.auth.UNAUTHORIZED,
        code: 'NO_TOKEN'
      });
    }

    // Extract token
    const token = authorization.replace('Bearer ', '').trim();
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: config.errors.auth.UNAUTHORIZED,
        code: 'EMPTY_TOKEN'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (jwtError) {
      logger.logSecurity('Invalid JWT token used', {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        url: req.originalUrl,
        tokenError: jwtError.message
      });

      let errorMessage = config.errors.auth.INVALID_TOKEN;
      let errorCode = 'INVALID_TOKEN';

      if (jwtError.name === 'TokenExpiredError') {
        errorMessage = config.errors.auth.TOKEN_EXPIRED;
        errorCode = 'TOKEN_EXPIRED';
      } else if (jwtError.name === 'JsonWebTokenError') {
        errorMessage = config.errors.auth.INVALID_TOKEN;
        errorCode = 'MALFORMED_TOKEN';
      }

      return res.status(401).json({ 
        success: false,
        error: errorMessage,
        code: errorCode
      });
    }

    // Validate token payload
    if (!decoded._id) {
      return res.status(401).json({ 
        success: false,
        error: config.errors.auth.INVALID_TOKEN,
        code: 'INVALID_PAYLOAD'
      });
    }

    // Find user in database
    const user = await User.findById(decoded._id).select('-password');
    
    if (!user) {
      logger.logSecurity('Authentication with non-existent user ID', {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        url: req.originalUrl,
        userId: decoded._id
      });

      return res.status(401).json({ 
        success: false,
        error: config.errors.auth.UNAUTHORIZED,
        code: 'USER_NOT_FOUND'
      });
    }

    // Attach user to request object
    req.user = user;
    req.userId = user._id.toString();
    req.token = token;

    // Log successful authentication (debug level)
    const duration = Date.now() - startTime;
    logger.debug('User authenticated successfully', {
      userId: user._id,
      email: user.email,
      ip: req.ip,
      duration: `${duration}ms`
    });

    next();
  } catch (error) {
    logger.error('Authentication middleware error:', {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      url: req.originalUrl
    });

    return res.status(500).json({ 
      success: false,
      error: config.errors.server.INTERNAL_ERROR,
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
const optionalAuth = async (req, res, next) => {
  const { authorization } = req.headers;
  
  // If no authorization header, continue without authentication
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return next();
  }

  // If authorization header exists, use regular authentication
  return authenticate(req, res, next);
};

/**
 * Role-based access control middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // This middleware should be used after authenticate
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: config.errors.auth.UNAUTHORIZED,
        code: 'NO_USER'
      });
    }

    // Check if user has required role (for future role implementation)
    const userRole = req.user.role || 'user';
    
    if (!roles.includes(userRole)) {
      logger.logSecurity('Unauthorized access attempt', {
        userId: req.user._id,
        userRole,
        requiredRoles: roles,
        ip: req.ip,
        url: req.originalUrl
      });

      return res.status(403).json({ 
        success: false,
        error: config.errors.auth.FORBIDDEN,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

/**
 * Check if user owns the resource
 */
const checkOwnership = (resourceIdParam = 'id', userIdField = 'postedBy') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          success: false,
          error: config.errors.auth.UNAUTHORIZED,
          code: 'NO_USER'
        });
      }

      const resourceId = req.params[resourceIdParam];
      const userId = req.user._id.toString();

      // For posts, comments, etc., check ownership
      if (userIdField === 'postedBy') {
        // This would need to be adapted based on the specific resource
        // For now, we'll add the ownership check to the route handlers
      }

      req.isOwner = true; // This would be determined by actual ownership check
      next();
    } catch (error) {
      logger.error('Ownership check error:', error);
      return res.status(500).json({ 
        success: false,
        error: config.errors.server.INTERNAL_ERROR,
        code: 'OWNERSHIP_ERROR'
      });
    }
  };
};

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  checkOwnership
}; 