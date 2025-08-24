/**
 * Facebook Lite Backend Server v2.0
 * Modern, secure, and scalable Express.js application
 */

// Import required dependencies
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

// Import configuration and utilities
const config = require('./config/constants');
const database = require('./config/database');
const logger = require('./utils/logger');

// Import middleware
const { applySecurity } = require('./middleware/security/security');
const { globalErrorHandler, notFoundHandler, catchAsync, timeoutHandler, uncaughtExceptionHandler, unhandledRejectionHandler } = require('./middleware/errorHandler');

// Import models (this will register them with mongoose)  
require('./models/user');
require('./models/post');
require('./models/chatRequest');
require('./models/chat');
require('./models/notification');

// Import routes
const authRoutes = require('./Routes/auth');
const postRoutes = require('./Routes/post');
const userRoutes = require('./Routes/user');
const chatRoutes = require('./Routes/chat');
const notificationRoutes = require('./Routes/notifications');

/**
 * Express Application Setup
 */
class FacebookLiteServer {
  constructor() {
    this.app = express();
    this.server = null;
    this.io = null;
    
    // Handle uncaught exceptions and unhandled rejections
    this.setupProcessHandlers();
    
    // Initialize the application
    this.init();
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      // Connect to database first
      await this.connectDatabase();
      
      // Setup middleware
      this.setupMiddleware();
      
      // Setup Socket.IO
      this.setupSocketIO();
      
      // Setup routes
      this.setupRoutes();
      
      // Setup error handling
      this.setupErrorHandling();
      
      // Start the server
      this.startServer();
      
    } catch (error) {
      logger.error('Failed to initialize server:', error);
      process.exit(1);
    }
  }

  /**
   * Connect to MongoDB database
   */
  async connectDatabase() {
    try {
      await database.connect();
      database.setupEventHandlers();
      logger.info('📊 Database setup completed');
    } catch (error) {
      logger.error('💀 Database connection failed:', error);
      throw error;
    }
  }

  /**
   * Setup middleware stack
   */
  setupMiddleware() {
    // Request timeout
    this.app.use(timeoutHandler(30000));

    // Security middleware (CORS, Helmet, Rate limiting, etc.)
    applySecurity(this.app);

    // Body parsing middleware
    this.app.use(express.json({ 
      limit: config.security.maxFileSize,
      verify: (req, res, buf) => {
        req.rawBody = buf;
      }
    }));
    
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: config.security.maxFileSize 
    }));

    // Request logging middleware
    this.app.use((req, res, next) => {
      const startTime = Date.now();
      
      // Log request
      logger.info(`📥 ${req.method} ${req.originalUrl}`, {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      // Log response when finished
      res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        logger.logRequest(req, res, responseTime);
      });

      next();
    });

    // Trust proxy (important for IP detection behind reverse proxies)
    this.app.set('trust proxy', 1);

    logger.info('🛡️ Middleware setup completed');
  }

  /**
   * Setup Socket.IO
   */
  setupSocketIO() {
    // Create HTTP server from Express app
    this.server = http.createServer(this.app);
    
    // Initialize Socket.IO
    this.io = socketIo(this.server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
      }
    });

    // Make io accessible to routes
    this.app.set('io', this.io);

    // Socket.IO connection handling
    this.io.on('connection', (socket) => {
      logger.info(`👤 User connected: ${socket.id}`);

      // Join chat room
      socket.on('join_chat', (chatId) => {
        socket.join(chatId);
        logger.info(`💬 User ${socket.id} joined chat: ${chatId}`);
      });

      // Leave chat room
      socket.on('leave_chat', (chatId) => {
        socket.leave(chatId);
        logger.info(`👋 User ${socket.id} left chat: ${chatId}`);
      });

      // Handle typing indicators
      socket.on('typing', (data) => {
        socket.to(data.chatId).emit('user_typing', {
          userId: data.userId,
          userName: data.userName
        });
      });

      socket.on('stop_typing', (data) => {
        socket.to(data.chatId).emit('user_stopped_typing', {
          userId: data.userId
        });
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        logger.info(`❌ User disconnected: ${socket.id}`);
      });
    });

    logger.info('🔌 Socket.IO setup completed');
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'Facebook Lite API is running',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        environment: config.server.nodeEnv,
        database: database.isConnected() ? 'connected' : 'disconnected'
      });
    });

    // Database health check
    this.app.get('/health/db', catchAsync(async (req, res) => {
      const dbHealth = await database.healthCheck();
      res.status(dbHealth.status === 'healthy' ? 200 : 503).json({
        success: dbHealth.status === 'healthy',
        database: dbHealth,
        timestamp: new Date().toISOString()
      });
    }));

    // API routes
    const apiRouter = express.Router();
    
    // Mount route modules
    apiRouter.use('/auth', authRoutes);
    apiRouter.use('/posts', postRoutes);
    apiRouter.use('/users', userRoutes);
    apiRouter.use('/chat', chatRoutes);
    apiRouter.use('/notifications', notificationRoutes);

    // Mount API router
    this.app.use(config.api.prefix, apiRouter);

    // Legacy route support (for backward compatibility)
    this.app.use('/api', apiRouter);
    this.app.use('/', apiRouter);

    // Serve static files in production
    if (config.server.isProduction) {
      this.app.use(express.static(path.join(__dirname, '../frontend/build')));
      
      // Handle React Router (return all non-API requests to React app)
      this.app.get('*', (req, res) => {
        if (!req.originalUrl.startsWith('/api')) {
          res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
        }
      });
    }

    logger.info('🚀 Routes setup completed');
  }

  /**
   * Setup error handling
   */
  setupErrorHandling() {
    // Handle 404 for undefined routes
    this.app.all('*', notFoundHandler);

    // Global error handling middleware
    this.app.use(globalErrorHandler);

    logger.info('❌ Error handling setup completed');
  }

  /**
   * Start the HTTP server
   */
  startServer() {
    const port = config.server.port;
    
    this.server.listen(port, () => {
      logger.info(`🎉 Facebook Lite server started successfully!`);
      logger.info(`💬 Socket.IO enabled for real-time chat`);
      logger.info(`💾 Database: ${database.isConnected() ? '✅ Connected' : '❌ Disconnected'}`);
      
      if (config.server.isDevelopment) {
        logger.info(`🔧 Development mode - detailed logging enabled`);
      }
    });

    // Handle server errors
    this.server.on('error', (error) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

      switch (error.code) {
        case 'EACCES':
          logger.error(`${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          logger.error(`${bind} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

    // Graceful shutdown
    this.setupGracefulShutdown();
  }

  /**
   * Setup graceful shutdown
   */
  setupGracefulShutdown() {
    const gracefulShutdown = async (signal) => {
      logger.info(`🛑 ${signal} received, shutting down gracefully...`);
      
      try {
        // Close HTTP server
        if (this.server) {
          await new Promise((resolve) => {
            this.server.close(resolve);
          });
          logger.info('✅ HTTP server closed');
        }

        // Close database connection
        await database.disconnect();
        
        logger.info('👋 Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  /**
   * Setup process error handlers
   */
  setupProcessHandlers() {
    // Handle uncaught exceptions
    uncaughtExceptionHandler();
    
    // Handle unhandled promise rejections
    unhandledRejectionHandler();
  }

  /**
   * Get Express app instance
   */
  getApp() {
    return this.app;
  }

  /**
   * Get server instance
   */
  getServer() {
    return this.server;
  }
}

// Create and start the server
const facebookLiteServer = new FacebookLiteServer();

// Export for testing
module.exports = facebookLiteServer.getApp();
