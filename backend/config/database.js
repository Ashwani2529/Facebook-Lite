const mongoose = require('mongoose');
const logger = require('../utils/logger');

class DatabaseConnection {
  constructor() {
    this.isConnected = false;
    this.retryCount = 0;
    this.maxRetries = 5;
  }

  async connect() {
    try {
      const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/facebook-lite';
      
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        family: 4, // Use IPv4, skip trying IPv6
        retryWrites: true,
        w: 'majority'
      };

      await mongoose.connect(MONGODB_URI, options);
      
      this.isConnected = true;
      this.retryCount = 0;
      logger.info('✅ Connected to MongoDB successfully');
      
      return true;
    } catch (error) {
      this.isConnected = false;
      this.retryCount++;
      
      logger.error('❌ MongoDB connection error:', error.message);
      
      if (this.retryCount < this.maxRetries) {
        logger.info(`🔄 Retrying connection... (${this.retryCount}/${this.maxRetries})`);
        setTimeout(() => this.connect(), 5000 * this.retryCount);
      } else {
        logger.error('💀 Max retries reached. Could not connect to MongoDB');
        throw error;
      }
      
      return false;
    }
  }

  setupEventHandlers() {
    mongoose.connection.on('connected', () => {
      this.isConnected = true;
      logger.info('🔗 Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      this.isConnected = false;
      logger.error('🚨 Mongoose connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      this.isConnected = false;
      logger.warn('⚠️ Mongoose disconnected from MongoDB');
    });

    // Close connection on app termination
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        logger.info('👋 MongoDB connection closed through app termination');
        process.exit(0);
      } catch (error) {
        logger.error('Error closing MongoDB connection:', error);
        process.exit(1);
      }
    });
  }

  async disconnect() {
    try {
      await mongoose.connection.close();
      this.isConnected = false;
      logger.info('👋 Disconnected from MongoDB');
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
  }

  // Health check method
  async healthCheck() {
    try {
      await mongoose.connection.db.admin().ping();
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        error: error.message, 
        timestamp: new Date().toISOString() 
      };
    }
  }
}

// Create and export a singleton instance
const dbConnection = new DatabaseConnection();

module.exports = {
  connect: () => dbConnection.connect(),
  disconnect: () => dbConnection.disconnect(),
  setupEventHandlers: () => dbConnection.setupEventHandlers(),
  getConnectionStatus: () => dbConnection.getConnectionStatus(),
  healthCheck: () => dbConnection.healthCheck(),
  isConnected: () => dbConnection.isConnected
}; 