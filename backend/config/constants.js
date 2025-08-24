require('dotenv').config();

const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development'
  },

  // Database Configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/facebook-lite',
    name: process.env.DB_NAME || 'facebook-lite'
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    algorithm: 'HS256'
  },

  // Security Configuration
  security: {
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12,
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    passwordMinLength: 6,
    usernameMinLength: 2
  },

  // CORS Configuration
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
  },

  // Email Configuration (for future features)
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  },

  // Cloudinary Configuration (for image uploads)
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET
  },

  // API Configuration
  api: {
    version: 'v1',
    prefix: '/api/v1',
    defaultLimit: 20,
    maxLimit: 100
  },

  // Validation Constants
  validation: {
    user: {
      nameMinLength: 2,
      nameMaxLength: 50,
      emailMaxLength: 100,
      passwordMinLength: 6,
      passwordMaxLength: 128
    },
    post: {
      bodyMinLength: 1,
      bodyMaxLength: 2000,
      maxCommentLength: 500
    }
  },

  // Error Messages
  errors: {
    auth: {
      INVALID_CREDENTIALS: 'Invalid email or password',
      USER_EXISTS: 'User already exists with that email',
      UNAUTHORIZED: 'Access denied. Authentication required',
      FORBIDDEN: 'Access denied. Insufficient permissions',
      TOKEN_EXPIRED: 'Token has expired. Please login again',
      INVALID_TOKEN: 'Invalid or malformed token'
    },
    validation: {
      REQUIRED_FIELDS: 'Please provide all required fields',
      INVALID_EMAIL: 'Please provide a valid email address',
      PASSWORD_TOO_SHORT: 'Password must be at least 6 characters long',
      INVALID_ID: 'Invalid ID format'
    },
    server: {
      INTERNAL_ERROR: 'Internal server error',
      NOT_FOUND: 'Resource not found',
      DATABASE_ERROR: 'Database operation failed'
    }
  },

  // Success Messages
  messages: {
    auth: {
      LOGIN_SUCCESS: 'Login successful',
      LOGOUT_SUCCESS: 'Logout successful',
      SIGNUP_SUCCESS: 'Account created successfully',
      PASSWORD_UPDATED: 'Password updated successfully'
    },
    post: {
      CREATED: 'Post created successfully',
      UPDATED: 'Post updated successfully',
      DELETED: 'Post deleted successfully',
      LIKED: 'Post liked successfully',
      UNLIKED: 'Post unliked successfully',
      COMMENT_ADDED: 'Comment added successfully'
    },
    user: {
      PROFILE_UPDATED: 'Profile updated successfully',
      FOLLOWED: 'User followed successfully',
      UNFOLLOWED: 'User unfollowed successfully'
    }
  },

  // Default Values
  defaults: {
    userProfilePicture: 'https://res.cloudinary.com/dtrsgpw04/image/upload/v1619875125/default-profile_xnpgiq.png',
    postImagePlaceholder: 'https://via.placeholder.com/400x300?text=No+Image'
  }
};

// Validation function to check required environment variables in production
const validateConfig = () => {
  if (config.server.isProduction) {
    const requiredEnvVars = [
      'MONGODB_URI',
      'JWT_SECRET'
    ];

    const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables:', missingVars.join(', '));
      process.exit(1);
    }
  }
};

// Validate configuration on module load
validateConfig();

module.exports = config; 