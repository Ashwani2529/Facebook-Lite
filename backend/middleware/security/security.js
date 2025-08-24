const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const config = require('../../config/constants');
const logger = require('../../utils/logger');

/**
 * Rate limiting middleware
 */
const createRateLimit = (options = {}) => {
  return rateLimit({
    windowMs: options.windowMs || config.rateLimit.windowMs,
    max: options.max || config.rateLimit.max,
    message: {
      success: false,
      error: options.message || config.rateLimit.message,
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: config.rateLimit.standardHeaders,
    legacyHeaders: config.rateLimit.legacyHeaders,
    handler: (req, res) => {
      logger.logSecurity('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        url: req.originalUrl,
        method: req.method
      });
      
      res.status(429).json({
        success: false,
        error: options.message || config.rateLimit.message,
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }
  });
};

/**
 * Strict rate limiting for authentication endpoints
 */
const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many authentication attempts, please try again in 15 minutes'
});

/**
 * API rate limiting for general endpoints
 */
const apiRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many API requests, please try again later'
});

/**
 * CORS configuration
 */
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      config.cors.origin,
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ];
    
    if (config.server.isDevelopment) {
      // In development, allow any localhost origin
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.logSecurity('CORS violation attempt', {
        origin,
        timestamp: new Date().toISOString()
      });
      callback(new Error('CORS policy violation'), false);
    }
  },
  credentials: config.cors.credentials,
  optionsSuccessStatus: config.cors.optionsSuccessStatus,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

/**
 * Security headers configuration using Helmet
 */
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'http:'],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false // Disable if using external resources
});

/**
 * Input sanitization middleware
 */
const sanitizeInput = [
  // Sanitize against NoSQL injection attacks
  mongoSanitize({
    replaceWith: '_'
  }),
  
  // Clean user input from malicious HTML/XSS
  xss(),
  
  // Prevent HTTP Parameter Pollution
  hpp({
    whitelist: ['tags', 'categories'] // Allow arrays for these fields
  })
];

/**
 * Security logging middleware
 */
const securityLogger = (req, res, next) => {
  // Log suspicious patterns
  const suspiciousPatterns = [
    /(\.\.\/|\.\.\\)/g, // Path traversal
    /<script/gi, // XSS attempts
    /union.*select/gi, // SQL injection
    /exec\(/gi, // Command injection
    /eval\(/gi, // Code injection
  ];

  const bodyString = JSON.stringify(req.body);
  const queryString = JSON.stringify(req.query);
  const paramsString = JSON.stringify(req.params);

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(bodyString) || pattern.test(queryString) || pattern.test(paramsString)) {
      logger.logSecurity('Suspicious input pattern detected', {
        pattern: pattern.toString(),
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        url: req.originalUrl,
        method: req.method,
        body: req.body,
        query: req.query,
        params: req.params
      });
      break;
    }
  }

  next();
};

/**
 * Request size limiting middleware
 */
const limitRequestSize = (req, res, next) => {
  const contentLength = parseInt(req.headers['content-length'] || '0');
  
  if (contentLength > config.security.maxFileSize) {
    logger.logSecurity('Request size limit exceeded', {
      contentLength,
      maxAllowed: config.security.maxFileSize,
      ip: req.ip,
      url: req.originalUrl
    });
    
    return res.status(413).json({
      success: false,
      error: 'Request entity too large',
      code: 'PAYLOAD_TOO_LARGE'
    });
  }
  
  next();
};

/**
 * IP-based blocking middleware (for known malicious IPs)
 */
const ipBlocking = (req, res, next) => {
  const blockedIPs = [
    // Add known malicious IPs here
    // '192.168.1.100'
  ];
  
  if (blockedIPs.includes(req.ip)) {
    logger.logSecurity('Blocked IP access attempt', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      url: req.originalUrl
    });
    
    return res.status(403).json({
      success: false,
      error: 'Access denied',
      code: 'IP_BLOCKED'
    });
  }
  
  next();
};

/**
 * User agent validation middleware
 */
const validateUserAgent = (req, res, next) => {
  const userAgent = req.headers['user-agent'];
  
  if (!userAgent) {
    logger.logSecurity('Request without User-Agent header', {
      ip: req.ip,
      url: req.originalUrl,
      headers: req.headers
    });
    
    return res.status(400).json({
      success: false,
      error: 'User-Agent header is required',
      code: 'NO_USER_AGENT'
    });
  }
  
  // Check for suspicious user agents
  const suspiciousAgents = [
    'bot', 'crawler', 'spider', 'scraper', 'scanner'
  ];
  
  const lowerAgent = userAgent.toLowerCase();
  if (suspiciousAgents.some(agent => lowerAgent.includes(agent))) {
    logger.logSecurity('Suspicious User-Agent detected', {
      userAgent,
      ip: req.ip,
      url: req.originalUrl
    });
  }
  
  next();
};

/**
 * Combined security middleware stack (simplified)
 */
const applySecurity = (app) => {
  // Basic security headers
  app.use(helmetConfig);
  
  // CORS configuration
  app.use(cors(corsOptions));
  
  logger.info('Security middleware applied successfully');
};

module.exports = {
  applySecurity,
  authRateLimit,
  apiRateLimit,
  corsOptions,
  helmetConfig,
  sanitizeInput,
  securityLogger,
  limitRequestSize,
  ipBlocking,
  validateUserAgent
}; 