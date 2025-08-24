const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logLevels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3
    };
    
    this.currentLevel = this.logLevels[process.env.LOG_LEVEL?.toUpperCase()] || this.logLevels.INFO;
    this.logDir = path.join(__dirname, '../logs');
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const pid = process.pid;
    
    let logEntry = {
      timestamp,
      level,
      pid,
      message
    };

    // Add metadata if provided
    if (Object.keys(meta).length > 0) {
      logEntry = { ...logEntry, ...meta };
    }

    return logEntry;
  }

  colorize(level, text) {
    const colors = {
      ERROR: '\x1b[31m', // Red
      WARN: '\x1b[33m',  // Yellow
      INFO: '\x1b[36m',  // Cyan
      DEBUG: '\x1b[90m', // Gray
      RESET: '\x1b[0m'   // Reset
    };

    return `${colors[level]}${text}${colors.RESET}`;
  }

  writeToFile(level, logEntry) {
    try {
      const logFile = path.join(this.logDir, `${new Date().toISOString().split('T')[0]}.log`);
      const errorLogFile = path.join(this.logDir, 'error.log');
      
      const logString = JSON.stringify(logEntry) + '\n';
      
      // Write to daily log file
      fs.appendFileSync(logFile, logString);
      
      // Write errors to separate error log
      if (level === 'ERROR') {
        fs.appendFileSync(errorLogFile, logString);
      }
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
  }

  log(level, message, meta = {}) {
    const levelValue = this.logLevels[level];
    
    if (levelValue > this.currentLevel) {
      return; // Skip if log level is below current threshold
    }

    const logEntry = this.formatMessage(level, message, meta);
    
    // Console output with colors
    if (process.env.NODE_ENV !== 'production') {
      const coloredLevel = this.colorize(level, `[${level}]`);
      const coloredTime = this.colorize('DEBUG', logEntry.timestamp);
      console.log(`${coloredTime} ${coloredLevel} ${message}`);
      
      if (Object.keys(meta).length > 0) {
        console.log(this.colorize('DEBUG', JSON.stringify(meta, null, 2)));
      }
    }

    // File output
    if (process.env.NODE_ENV === 'production' || process.env.LOG_TO_FILE === 'true') {
      this.writeToFile(level, logEntry);
    }
  }

  error(message, meta = {}) {
    // Handle Error objects
    if (message instanceof Error) {
      meta = {
        ...meta,
        stack: message.stack,
        name: message.name
      };
      message = message.message;
    }
    
    this.log('ERROR', message, meta);
  }

  warn(message, meta = {}) {
    this.log('WARN', message, meta);
  }

  info(message, meta = {}) {
    this.log('INFO', message, meta);
  }

  debug(message, meta = {}) {
    this.log('DEBUG', message, meta);
  }

  // HTTP request logging
  logRequest(req, res, responseTime) {
    const { method, url, ip, headers } = req;
    const { statusCode } = res;
    
    const meta = {
      method,
      url,
      ip,
      statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: headers['user-agent'],
      contentLength: res.get('content-length') || 0
    };

    // Log different levels based on status code
    if (statusCode >= 500) {
      this.error(`${method} ${url} - ${statusCode}`, meta);
    } else if (statusCode >= 400) {
      this.warn(`${method} ${url} - ${statusCode}`, meta);
    } else {
      this.info(`${method} ${url} - ${statusCode}`, meta);
    }
  }

  // Database operation logging
  logDatabase(operation, collection, result, duration) {
    const meta = {
      operation,
      collection,
      duration: `${duration}ms`,
      result: typeof result === 'object' ? 'Object' : result
    };

    this.debug(`DB ${operation} on ${collection}`, meta);
  }

  // Security event logging
  logSecurity(event, details = {}) {
    this.warn(`SECURITY: ${event}`, {
      ...details,
      timestamp: new Date().toISOString(),
      level: 'SECURITY'
    });
  }

  // Application startup/shutdown logging
  logApp(message, meta = {}) {
    this.info(`APP: ${message}`, meta);
  }

  // Clean up old log files (keep last 30 days)
  cleanup() {
    try {
      const files = fs.readdirSync(this.logDir);
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

      files.forEach(file => {
        if (file.endsWith('.log') && file !== 'error.log') {
          const filePath = path.join(this.logDir, file);
          const stats = fs.statSync(filePath);
          
          if (stats.mtime < thirtyDaysAgo) {
            fs.unlinkSync(filePath);
            this.info(`Cleaned up old log file: ${file}`);
          }
        }
      });
    } catch (err) {
      this.error('Error during log cleanup:', err);
    }
  }
}

// Create and export singleton instance
const logger = new Logger();

// Clean up logs on startup (in production)
if (process.env.NODE_ENV === 'production') {
  logger.cleanup();
}

module.exports = logger; 