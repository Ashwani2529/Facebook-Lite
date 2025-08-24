# Facebook Lite Backend v2.0

A modern, secure, and scalable Node.js/Express.js backend for the Facebook Lite social media application.

## 🚀 What's New in v2.0

### Major Improvements
- ✅ **Complete Security Overhaul** - Helmet, CORS, Rate limiting, Input sanitization
- ✅ **Professional Logging System** - Structured logging with different levels and file rotation
- ✅ **Robust Authentication** - JWT with account locking, role-based access control
- ✅ **Input Validation** - Comprehensive validation and sanitization middleware
- ✅ **Error Handling** - Centralized error handling with proper HTTP status codes
- ✅ **Database Optimization** - Connection pooling, indexing, query optimization
- ✅ **Modern Architecture** - Clean separation of concerns, middleware-first approach
- ✅ **Environment Configuration** - Proper config management and validation

## 📁 Project Structure

```
backend/
├── config/
│   ├── constants.js          # Configuration and environment variables
│   └── database.js           # Database connection management
├── controllers/              # Request handlers (future expansion)
├── middleware/
│   ├── auth/
│   │   └── authenticate.js   # JWT authentication & authorization
│   ├── validation/
│   │   └── validators.js     # Input validation & sanitization
│   ├── security/
│   │   └── security.js       # Security middleware (helmet, cors, etc.)
│   └── errorHandler.js       # Global error handling
├── models/
│   ├── User.js              # Enhanced user model with validation
│   └── Post.js              # Enhanced post model with features
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── post.js              # Post management routes
│   └── user.js              # User management routes
├── services/                # Business logic (future expansion)
├── utils/
│   └── logger.js            # Professional logging utility
├── logs/                    # Application logs (auto-created)
├── server.js               # Main application entry point
└── package.json            # Dependencies and scripts
```

## 🛠 Environment Setup

### 1. Environment Variables

Create a `.env` file in the backend directory:

```bash
# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/facebook-lite
DB_NAME=facebook-lite

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# CORS Configuration
CLIENT_URL=http://localhost:3000

# Security Configuration
BCRYPT_SALT_ROUNDS=12
MAX_FILE_SIZE=5242880
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=INFO
LOG_TO_FILE=true
```

### 2. Installation

```bash
cd backend
npm install
```

### 3. Development

```bash
# Start development server with auto-reload
npm run dev

# Start production server
npm start

# Run with frontend concurrently
npm run fullstack

# Run tests
npm test

# Check for security vulnerabilities
npm run security-check

# Clean old log files
npm run logs:clean
```

## 🔒 Security Features

### Authentication & Authorization
- **JWT-based authentication** with configurable expiration
- **Account locking** after failed login attempts
- **Role-based access control** (user, admin, moderator)
- **Password hashing** with bcrypt (configurable rounds)
- **Security logging** for all authentication events

### Input Validation & Sanitization
- **XSS protection** with input cleaning
- **NoSQL injection prevention** 
- **Parameter pollution protection**
- **Request size limiting**
- **File type validation** for uploads

### Security Headers & Policies
- **Helmet.js** for security headers
- **CORS** with whitelist configuration
- **Rate limiting** (configurable per endpoint)
- **Request timeout handling**
- **IP-based blocking capability**

### Monitoring & Logging
- **Security event logging**
- **Failed authentication tracking**
- **Suspicious pattern detection**
- **Request/response logging**

## 📊 Database Features

### Enhanced Models
- **User Model**: Comprehensive validation, indexing, virtual fields, security features
- **Post Model**: Content moderation, analytics, engagement scoring, visibility controls

### Performance Optimizations
- **Database indexing** for faster queries
- **Connection pooling** with automatic retry
- **Query optimization** with population strategies
- **Aggregation pipelines** for analytics

### Data Integrity
- **Schema validation** with custom validators
- **Referential integrity** with cascade operations
- **Data sanitization** at model level
- **Audit trails** for sensitive operations

## 🔄 API Endpoints

### Authentication (`/api/v1/auth`)
- `GET /` - API information
- `POST /signup` - User registration
- `POST /signin` - User login
- `GET /verify-token` - Token validation
- `GET /me` - Get current user
- `PUT /me` - Update profile
- `PUT /change-password` - Change password
- `POST /logout` - User logout
- `POST /forgot-password` - Password reset request

### Posts (`/api/v1/posts`)
- `GET /` - Get all posts (paginated)
- `POST /` - Create new post
- `GET /:id` - Get specific post
- `PUT /:id` - Update post (owner only)
- `DELETE /:id` - Delete post (owner only)
- `PUT /:id/like` - Like/unlike post
- `POST /:id/comments` - Add comment
- `GET /trending` - Get trending posts
- `GET /feed` - Get user feed

### Users (`/api/v1/users`)
- `GET /search` - Search users
- `GET /:id` - Get user profile
- `GET /:id/posts` - Get user posts
- `PUT /follow` - Follow user
- `PUT /unfollow` - Unfollow user
- `GET /:id/followers` - Get followers
- `GET /:id/following` - Get following

### Health Check
- `GET /health` - Application health
- `GET /health/db` - Database health

## 📝 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- auth.test.js
```

## 📊 Logging

### Log Levels
- **ERROR**: Application errors and exceptions
- **WARN**: Warning messages and security events
- **INFO**: General application information
- **DEBUG**: Detailed debugging information

### Log Files
- `logs/YYYY-MM-DD.log` - Daily application logs
- `logs/error.log` - Error-specific logs
- Automatic cleanup of logs older than 30 days

### Security Logging
- Authentication attempts (success/failure)
- Account lockouts and suspicious activities
- Rate limit violations
- Input validation failures
- CORS violations

## 🔧 Configuration

### Security Configuration
```javascript
// config/constants.js
security: {
  bcryptSaltRounds: 12,
  maxFileSize: 5 * 1024 * 1024, // 5MB
  passwordMinLength: 6,
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif']
}
```

### Rate Limiting
```javascript
rateLimit: {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // requests per window
  message: 'Too many requests, please try again later.'
}
```

## 🚀 Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure secure `JWT_SECRET`
- [ ] Set up MongoDB connection string
- [ ] Configure CORS origins
- [ ] Set up SSL certificates
- [ ] Configure reverse proxy (nginx)
- [ ] Set up monitoring and alerts
- [ ] Configure log rotation
- [ ] Set up backup strategies

### Docker Support (Future)
```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Use ESLint configuration provided
- Follow existing naming conventions
- Add JSDoc comments for functions
- Write tests for new features
- Update documentation as needed

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)

## 🐛 Troubleshooting

### Common Issues

**Database Connection Failed**
- Check MongoDB connection string
- Verify network connectivity
- Check database user permissions

**JWT Token Issues**
- Verify JWT_SECRET configuration
- Check token expiration settings
- Ensure client sends proper Authorization header

**Rate Limiting Errors**
- Adjust rate limit configuration
- Implement user-specific rate limiting
- Use Redis for distributed rate limiting

**Performance Issues**
- Monitor database query performance
- Check for proper indexing
- Use database connection pooling
- Implement caching strategies

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Facebook Lite Backend v2.0** - Built with ❤️ for modern web applications. 