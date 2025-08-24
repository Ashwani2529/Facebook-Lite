const config = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Custom Application Error Class
 */
class AppError extends Error {
  constructor(message, statusCode, code = null, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.code = code;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle specific MongoDB/Mongoose errors
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400, 'INVALID_ID');
};

const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists`;
  return new AppError(message, 400, 'DUPLICATE_FIELD');
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, 400, 'VALIDATION_ERROR');
};

/**
 * Handle JWT errors
 */
const handleJWTError = () =>
  new AppError(config.errors.auth.INVALID_TOKEN, 401, 'INVALID_TOKEN');

const handleJWTExpiredError = () =>
  new AppError(config.errors.auth.TOKEN_EXPIRED, 401, 'TOKEN_EXPIRED');

/**
 * Send error response for development environment
 */
const sendErrorDev = (err, req, res) => {
  // API Error
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
      stack: err.stack,
      details: err
    });
  }

  // Non-API Error
  res.status(err.statusCode).json({
    success: false,
    error: err.message,
    code: err.code,
    stack: err.stack
  });
};

/**
 * Send error response for production environment
 */
const sendErrorProd = (err, req, res) => {
  // API Error
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        success: false,
        error: err.message,
        code: err.code
      });
    }

    // Programming or other unknown error: don't leak error details
    logger.error('Unknown Error:', {
      error: err,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.status(500).json({
      success: false,
      error: config.errors.server.INTERNAL_ERROR,
      code: 'INTERNAL_ERROR'
    });
  }

  // Non-API Operational Error
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code
    });
  }

  // Non-API Unknown Error
  logger.error('Unknown Error:', {
    error: err,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  res.status(500).json({
    success: false,
    error: config.errors.server.INTERNAL_ERROR,
    code: 'INTERNAL_ERROR'
  });
};

/**
 * Global error handling middleware
 */
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log all errors
  const logData = {
    message: err.message,
    statusCode: err.statusCode,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    userId: req.user ? req.user._id : 'anonymous'
  };

  if (err.statusCode >= 500) {
    logger.error('Server Error:', logData);
  } else {
    logger.warn('Client Error:', logData);
  }

  if (config.server.isDevelopment) {
    sendErrorDev(err, req, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};

/**
 * Handle async errors (catch async errors without try-catch)
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Handle 404 errors for undefined routes
 */
const notFoundHandler = (req, res, next) => {
  const err = new AppError(
    `Can't find ${req.originalUrl} on this server!`,
    404,
    'ROUTE_NOT_FOUND'
  );
  next(err);
};

/**
 * Validation error formatter
 */
const formatValidationError = (errors) => {
  return {
    success: false,
    error: 'Validation failed',
    code: 'VALIDATION_ERROR',
    details: errors.map(err => ({
      field: err.field,
      message: err.error,
      value: err.value
    }))
  };
};

/**
 * Create standardized API responses
 */
const sendResponse = {
  success: (res, data, message = 'Success', statusCode = 200) => {
    res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  },

  error: (res, message, statusCode = 400, code = null, details = null) => {
    const response = {
      success: false,
      error: message,
      timestamp: new Date().toISOString()
    };

    if (code) response.code = code;
    if (details) response.details = details;

    res.status(statusCode).json(response);
  },

  created: (res, data, message = 'Created successfully') => {
    res.status(201).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  },

  noContent: (res, message = 'No content') => {
    res.status(204).json({
      success: true,
      message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Request timeout handler
 */
const timeoutHandler = (timeout = 30000) => {
  return (req, res, next) => {
    res.setTimeout(timeout, () => {
      const err = new AppError(
        'Request timeout - please try again',
        408,
        'REQUEST_TIMEOUT'
      );
      next(err);
    });
    next();
  };
};

/**
 * Rate limit error handler
 */
const rateLimitHandler = (req, res) => {
  logger.logSecurity('Rate limit exceeded', {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    url: req.originalUrl,
    method: req.method
  });

  res.status(429).json({
    success: false,
    error: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED',
    timestamp: new Date().toISOString()
  });
};

/**
 * Database connection error handler
 */
const dbErrorHandler = (error) => {
  logger.error('Database Error:', {
    message: error.message,
    code: error.code,
    stack: error.stack
  });

  return new AppError(
    config.errors.server.DATABASE_ERROR,
    503,
    'DATABASE_ERROR'
  );
};

/**
 * Unhandled promise rejection handler
 */
const unhandledRejectionHandler = () => {
  process.on('unhandledRejection', (err, promise) => {
    logger.error('Unhandled Promise Rejection:', {
      error: err.message,
      stack: err.stack,
      promise
    });

    // Close server & exit process
    process.exit(1);
  });
};

/**
 * Uncaught exception handler
 */
const uncaughtExceptionHandler = () => {
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', {
      error: err.message,
      stack: err.stack
    });

    // Close server & exit process
    process.exit(1);
  });
};

module.exports = {
  AppError,
  globalErrorHandler,
  catchAsync,
  notFoundHandler,
  formatValidationError,
  sendResponse,
  timeoutHandler,
  rateLimitHandler,
  dbErrorHandler,
  unhandledRejectionHandler,
  uncaughtExceptionHandler
}; 