# Facebook Lite Backend Server

## Quick Start

### Option 1: Using Batch File (Windows)
```bash
# Double-click or run in command prompt:
start-server.bat
```

### Option 2: Using npm commands
```bash
# For development with auto-restart:
npm run dev

# For production:
npm start
```

### Option 3: Manual start
```bash
node server.js
```

## Server Information

- **Server URL:** http://localhost:5000
- **API Base:** http://localhost:5000/api/v1
- **Health Check:** http://localhost:5000/health

## API Endpoints

### Authentication
- `POST /api/v1/auth/signup` - Register new user
- `POST /api/v1/auth/signin` - Login user
- `GET /api/v1/auth/me` - Get current user
- `PUT /api/v1/auth/me` - Update user profile

### Posts
- `GET /api/v1/posts/allpost` - Get all posts
- `POST /api/v1/posts/createpost` - Create new post
- `PUT /api/v1/posts/like` - Like a post
- `PUT /api/v1/posts/unlike` - Unlike a post
- `PUT /api/v1/posts/comment` - Add comment to post

### Users
- `GET /api/v1/users/user/:id` - Get user profile
- `PUT /api/v1/users/follow` - Follow a user
- `PUT /api/v1/users/unfollow` - Unfollow a user

## Troubleshooting

### Server Won't Start
1. Make sure MongoDB is running
2. Check if port 5000 is available
3. Kill any existing Node.js processes: `taskkill /IM node.exe /F`
4. Try starting again

### Connection Refused Errors
1. Make sure the server is running: `http://localhost:5000/health`
2. Check server logs for errors
3. Restart the server

### Database Connection Issues
1. Start MongoDB service
2. Check database connection string in config
3. Make sure database is accessible

## Development Notes

- Uses nodemon for auto-restart in development mode
- Server logs all requests and errors
- CORS enabled for frontend development
- JWT authentication for protected routes 