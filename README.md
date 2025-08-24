# Facebook Lite 🚀

A modern, full-stack social media platform built with the MERN stack, featuring real-time notifications, chat system, and beautiful dark/light theme support.

## ✨ Features

- 👤 **User Authentication** - Secure JWT-based auth with profile management
- 📱 **Posts & Media** - Create, like, comment on posts with image uploads
- 💬 **Real-time Chat** - One-to-one messaging with Socket.IO
- 🔔 **Live Notifications** - Real-time notifications for likes, comments, follows
- 🌓 **Dark/Light Theme** - Beautiful UI with theme persistence
- 👥 **Social Features** - Follow users, discover posts, user profiles
- 📱 **Responsive Design** - Works perfectly on all devices
- 🔒 **Security** - Rate limiting, input validation, secure headers

## 🛠️ Tech Stack

**Frontend:**
- React.js with Context API
- Tailwind CSS + Bootstrap
- Framer Motion animations
- React Hot Toast notifications
- React Router DOM

**Backend:**
- Node.js + Express.js
- MongoDB with Mongoose
- JWT Authentication
- Socket.IO for real-time features
- Cloudinary for image uploads
- Security middleware (Helmet, CORS, Rate limiting)

## ⚡ Quick Start

### 🔧 Environment Setup

**Important: Both frontend and backend require environment variables to be configured.**

#### Backend Setup:
```bash
cd backend
cp .env.example .env
# Edit .env with your actual credentials
npm install
npm start
```

#### Frontend Setup:
```bash
cd frontend  
cp .env.example .env
# Edit .env with your actual credentials
npm install
npm start
```

### 📋 Required Environment Variables

#### Backend (.env):
```env
# Database
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-super-secret-jwt-key-min-32-characters

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Server
PORT=5000
CLIENT_URL=http://localhost:3000
```

#### Frontend (.env):
```env
# API Configuration
REACT_APP_SERVER_URL=http://localhost:5000

# Cloudinary
REACT_APP_CLOUDINARY_CLOUD_NAME=your-cloud-name
REACT_APP_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
```

### 🚀 Development

1. **Start Backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm start
   ```

3. **Access Application:**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000
   - API: http://localhost:5000/api/v1

## 📱 Features Overview

### Authentication System
- Secure signup with email, phone, date of birth validation
- JWT-based authentication with refresh tokens
- Profile management with image uploads

### Social Features  
- Create posts with images
- Like and comment system
- Follow/unfollow users
- User discovery and search
- Real-time notifications

### Chat System
- Send chat requests to users
- Real-time one-to-one messaging
- WhatsApp-like interface
- Message read receipts
- Online status indicators

### UI/UX
- Dark/Light theme toggle with persistence
- Responsive design for all devices
- Beautiful animations and transitions
- Toast notifications for user feedback
- Infinite scroll with pagination

## 🔒 Security Features

- Input validation and sanitization
- Rate limiting on API endpoints
- CORS configuration
- Secure HTTP headers with Helmet
- JWT token expiration and rotation
- Password hashing with bcrypt
- File upload security

## 🌟 Developer Experience

- Hot reload in development
- Comprehensive error handling
- Logging system with different levels  
- Clean code architecture
- Environment-based configuration
- Git hooks for code quality

## 📄 API Documentation

### Authentication Endpoints
```
POST /api/v1/auth/signup - Create new account
POST /api/v1/auth/signin - Login user
GET  /api/v1/auth/me     - Get current user
PUT  /api/v1/auth/me     - Update user profile
```

### Posts Endpoints
```
GET  /api/v1/posts/allpost    - Get all posts (paginated)
POST /api/v1/posts/createpost - Create new post
PUT  /api/v1/posts/like       - Like/unlike post
PUT  /api/v1/posts/comment    - Add comment
```

### Users Endpoints
```
GET  /api/v1/users/user/:id     - Get user profile
PUT  /api/v1/users/follow       - Follow user
PUT  /api/v1/users/unfollow     - Unfollow user
GET  /api/v1/users/search-users - Search users
```

### Chat Endpoints
```
POST /api/v1/chat/request              - Send chat request
GET  /api/v1/chat/chats                - Get user chats
GET  /api/v1/chat/chat/:id/messages    - Get chat messages
POST /api/v1/chat/chat/:id/message     - Send message
```

### Notifications Endpoints
```
GET  /api/v1/notifications           - Get notifications
PUT  /api/v1/notifications/mark-read - Mark as read
GET  /api/v1/notifications/unread-count - Get unread count
```

## 🚀 Deployment

### Environment Configuration

**Production Backend:**
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=super-secure-production-key-min-64-characters
CLIENT_URL=https://yourdomain.com
```

**Production Frontend:**
```env
REACT_APP_SERVER_URL=https://api.yourdomain.com
REACT_APP_CLOUDINARY_CLOUD_NAME=prod-cloud-name
```

### Deployment Steps

1. **Backend (Railway/Render/Heroku):**
   ```bash
   # Add environment variables in platform dashboard
   # Deploy from GitHub or direct upload
   ```

2. **Frontend (Vercel/Netlify):**
   ```bash
   # Add environment variables in platform dashboard
   # Deploy from GitHub with automatic builds
   ```

## 👨‍💻 Developer

**Ashwani Kumar Singh**  
Full Stack Developer | MERN Stack Specialist

- **Portfolio:** [ashwanisingh-portfolio.netlify.app](https://ashwanisingh-portfolio.netlify.app/)
- **LeetCode:** 566+ problems solved
- **Experience:** Programmer Analyst Trainee @ Cognizant
- **Skills:** React.js, Node.js, MongoDB, Express.js, JWT, Socket.IO

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

**⚠️ Security Notice:** Never commit `.env` files to version control. Always use `.env.example` for sharing configuration templates.