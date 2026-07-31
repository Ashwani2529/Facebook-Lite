const express = require('express');
const http = require('http');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const path = require('path');
const socketIo = require('socket.io');

const config = require('./config/constants');
const database = require('./config/database');
const logger = require('./utils/logger');
const {
  applySecurity,
  apiRateLimit,
  sanitizeInput,
  securityLogger
} = require('./middleware/security/security');
const {
  globalErrorHandler,
  notFoundHandler,
  catchAsync,
  timeoutHandler,
  uncaughtExceptionHandler,
  unhandledRejectionHandler
} = require('./middleware/errorHandler');

require('./models/user');
require('./models/post');
require('./models/chatRequest');
require('./models/chat');
require('./models/notification');

const authRoutes = require('./Routes/auth');
const postRoutes = require('./Routes/post');
const userRoutes = require('./Routes/user');
const chatRoutes = require('./Routes/chat');
const notificationRoutes = require('./Routes/notifications');

class FacebookLiteServer {
  constructor() {
    this.app = express();
    this.server = null;
    this.io = null;
    this.shuttingDown = false;
    this.setupProcessHandlers();
    this.ready = this.init();
  }

  async init() {
    try {
      await database.connect();
      database.setupEventHandlers();
      this.setupMiddleware();
      this.setupSocketIO();
      this.setupRoutes();
      this.setupErrorHandling();
      this.startServer();
    } catch (error) {
      logger.error('Failed to initialize server', { error: error.message });
      if (require.main === module) process.exit(1);
      throw error;
    }
  }

  setupMiddleware() {
    this.app.set('trust proxy', 1);
    this.app.use(timeoutHandler(30000));
    applySecurity(this.app);
    this.app.use(express.json({ limit: config.security.maxFileSize }));
    this.app.use(express.urlencoded({ extended: true, limit: config.security.maxFileSize }));
    this.app.use(sanitizeInput);
    this.app.use(securityLogger);

    this.app.use((req, res, next) => {
      const startedAt = Date.now();
      res.on('finish', () => logger.logRequest(req, res, Date.now() - startedAt));
      next();
    });
  }

  setupSocketIO() {
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server, {
      cors: {
        origin: config.cors.origin,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
      },
      pingInterval: 25000,
      pingTimeout: 20000,
      connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000,
        skipMiddlewares: false
      }
    });
    this.app.set('io', this.io);

    this.io.use(async (socket, next) => {
      try {
        const header = socket.handshake.headers.authorization;
        const token = socket.handshake.auth?.token
          || (header?.startsWith('Bearer ') ? header.slice(7) : null);
        if (!token) return next(new Error('Authentication required'));

        const payload = jwt.verify(token, config.jwt.secret);
        const user = await mongoose.model('User')
          .findById(payload._id)
          .select('_id name isActive');
        if (!user || user.isActive === false) return next(new Error('Invalid session'));
        socket.user = user;
        return next();
      } catch (error) {
        return next(new Error(error.name === 'TokenExpiredError' ? 'Session expired' : 'Invalid session'));
      }
    });

    this.io.on('connection', socket => {
      const userId = socket.user._id.toString();
      socket.join(`user:${userId}`);
      logger.info('Socket connected', { socketId: socket.id, userId });

      const canAccessChat = async chatId => (
        mongoose.isValidObjectId(chatId)
        && Boolean(await mongoose.model('Chat').exists({
          _id: chatId,
          participants: socket.user._id,
          isActive: true
        }))
      );

      socket.on('join_chat', async (payload = {}, acknowledgement = () => {}) => {
        try {
          const chatId = typeof payload === 'string' ? payload : payload.chatId;
          if (!(await canAccessChat(chatId))) {
            return acknowledgement({ ok: false, error: 'You cannot access this chat' });
          }
          await socket.join(`chat:${chatId}`);
          return acknowledgement({ ok: true });
        } catch (error) {
          logger.error('Socket join_chat failed', { userId, error: error.message });
          return acknowledgement({ ok: false, error: 'Unable to join chat' });
        }
      });

      socket.on('leave_chat', async (payload = {}) => {
        const chatId = typeof payload === 'string' ? payload : payload.chatId;
        if (mongoose.isValidObjectId(chatId)) await socket.leave(`chat:${chatId}`);
      });

      socket.on('join_post', async (payload = {}) => {
        const postId = typeof payload === 'string' ? payload : payload.postId;
        if (mongoose.isValidObjectId(postId)) {
          await socket.join(`post:${postId}`);
        }
      });

      socket.on('leave_post', async (payload = {}) => {
        const postId = typeof payload === 'string' ? payload : payload.postId;
        if (mongoose.isValidObjectId(postId)) await socket.leave(`post:${postId}`);
      });

      const forwardTyping = async (event, payload = {}) => {
        if (!(await canAccessChat(payload.chatId))) return;
        socket.to(`chat:${payload.chatId}`).emit(event, {
          chatId: payload.chatId,
          userId,
          userName: socket.user.name
        });
      };

      socket.on('typing', payload => {
        forwardTyping('user_typing', payload).catch(error => {
          logger.error('Typing event failed', { userId, error: error.message });
        });
      });
      socket.on('stop_typing', payload => {
        forwardTyping('user_stopped_typing', payload).catch(error => {
          logger.error('Stop typing event failed', { userId, error: error.message });
        });
      });
      socket.on('error', error => {
        logger.error('Socket error', { socketId: socket.id, userId, error: error.message });
      });
      socket.on('disconnect', reason => {
        logger.info('Socket disconnected', { socketId: socket.id, userId, reason });
      });
    });
  }

  setupRoutes() {
    this.app.get('/health', (req, res) => {
      res.status(database.isConnected() ? 200 : 503).json({
        success: database.isConnected(),
        message: 'Facebook Lite API is running',
        timestamp: new Date().toISOString(),
        version: '2.1.0',
        environment: config.server.nodeEnv,
        database: database.isConnected() ? 'connected' : 'disconnected'
      });
    });

    this.app.get('/health/db', catchAsync(async (req, res) => {
      const dbHealth = await database.healthCheck();
      res.status(dbHealth.status === 'healthy' ? 200 : 503).json({
        success: dbHealth.status === 'healthy',
        database: dbHealth,
        timestamp: new Date().toISOString()
      });
    }));

    const apiRouter = express.Router();
    apiRouter.use(apiRateLimit);
    apiRouter.use('/auth', authRoutes);
    apiRouter.use('/posts', postRoutes);
    apiRouter.use('/users', userRoutes);
    apiRouter.use('/chat', chatRoutes);
    apiRouter.use('/notifications', notificationRoutes);

    this.app.use(config.api.prefix, apiRouter);
    this.app.use('/api', apiRouter);
    this.app.use('/', apiRouter);

    if (config.server.isProduction) {
      const buildPath = path.join(__dirname, '../frontend/build');
      this.app.use(express.static(buildPath));
      this.app.get('*', (req, res, next) => {
        if (req.originalUrl.startsWith('/api')) return next();
        return res.sendFile(path.join(buildPath, 'index.html'));
      });
    }
  }

  setupErrorHandling() {
    this.app.all('*', notFoundHandler);
    this.app.use(globalErrorHandler);
  }

  startServer() {
    this.server.setTimeout(10 * 60 * 1000);
    this.server.listen(config.server.port, () => {
      logger.info('Facebook Lite server started', { port: config.server.port });
    });
    this.server.on('error', error => {
      logger.error('HTTP server error', { code: error.code, error: error.message });
      if (['EACCES', 'EADDRINUSE'].includes(error.code)) process.exit(1);
    });
    this.setupGracefulShutdown();
  }

  setupGracefulShutdown() {
    const shutdown = async signal => {
      if (this.shuttingDown) return;
      this.shuttingDown = true;
      logger.info('Graceful shutdown started', { signal });
      try {
        if (this.io) await new Promise(resolve => this.io.close(resolve));
        if (this.server?.listening) {
          await new Promise(resolve => this.server.close(resolve));
        }
        await database.disconnect();
        process.exit(0);
      } catch (error) {
        logger.error('Graceful shutdown failed', { error: error.message });
        process.exit(1);
      }
    };
    process.once('SIGTERM', () => shutdown('SIGTERM'));
    process.once('SIGINT', () => shutdown('SIGINT'));
  }

  setupProcessHandlers() {
    uncaughtExceptionHandler();
    unhandledRejectionHandler();
  }

  getApp() {
    return this.app;
  }
}

const facebookLiteServer = new FacebookLiteServer();
module.exports = facebookLiteServer.getApp();
