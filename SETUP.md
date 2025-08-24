# 🚀 Facebook Lite - Environment Setup Guide

This guide will help you set up environment variables for both frontend and backend applications.

## 🔧 Quick Setup (Automated)

Run the automated setup script:

```bash
# From project root
node setup-env.js
```

Choose option 1 for quick setup with defaults, or option 2 for custom configuration.

## 🛠️ Manual Setup

### Backend Environment Variables

1. **Create environment files:**
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Edit `backend/.env` with your values:**

   ```env
   # Database - Replace with your MongoDB connection string
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/facebook-lite
   
   # Security - Generate a strong JWT secret (minimum 32 characters)
   JWT_SECRET=your-super-secret-jwt-key-here-min-32-characters
   
   # Cloudinary - Get these from your Cloudinary dashboard
   CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
   CLOUDINARY_API_KEY=your-cloudinary-api-key
   CLOUDINARY_API_SECRET=your-cloudinary-api-secret
   
   # Server Configuration
   PORT=5000
   CLIENT_URL=http://localhost:3000
   ```

### Frontend Environment Variables

1. **Create environment files:**
   ```bash
   cd frontend
   cp .env.example .env
   ```

2. **Edit `frontend/.env` with your values:**

   ```env
   # API Configuration
   REACT_APP_SERVER_URL=http://localhost:5000
   
   # Cloudinary Configuration
   REACT_APP_CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
   REACT_APP_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
   ```

## 📋 Required Services Setup

### 1. MongoDB Database

**Option A: MongoDB Atlas (Cloud - Recommended)**
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account and cluster
3. Get your connection string
4. Replace `MONGODB_URI` in backend/.env

**Option B: Local MongoDB**
```bash
# Install MongoDB locally
# Use: MONGODB_URI=mongodb://localhost:27017/facebook-lite
```

### 2. Cloudinary Setup (For Image Uploads)

1. Go to [Cloudinary](https://cloudinary.com)
2. Create a free account
3. Go to Dashboard → Settings
4. Get your credentials:
   - **Cloud Name:** Found on dashboard
   - **API Key:** Found on dashboard  
   - **API Secret:** Found on dashboard
5. Create an **Upload Preset:**
   - Go to Settings → Upload
   - Click "Add upload preset"
   - Set signing mode to "Unsigned"
   - Copy the preset name

### 3. JWT Secret Generation

Generate a strong JWT secret (minimum 32 characters):

```bash
# Option 1: OpenSSL
openssl rand -base64 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 3: Online generator
# Visit: https://generate-secret.vercel.app/32
```

## 🔒 Security Best Practices

### ⚠️ Critical Security Rules:

1. **Never commit .env files** to version control
2. **Use strong JWT secrets** (minimum 32 characters)  
3. **Use environment-specific values** for production
4. **Regularly rotate secrets** in production
5. **Limit CORS origins** in production

### Production Environment Variables:

**Backend (.env):**
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://prod-user:strong-password@cluster.mongodb.net/facebook-lite-prod
JWT_SECRET=super-secure-production-jwt-secret-min-64-characters-recommended
CLIENT_URL=https://yourdomain.com
CLOUDINARY_CLOUD_NAME=prod-cloud-name
```

**Frontend (.env):**
```env
REACT_APP_SERVER_URL=https://api.yourdomain.com
REACT_APP_CLOUDINARY_CLOUD_NAME=prod-cloud-name
REACT_APP_CLOUDINARY_UPLOAD_PRESET=prod-preset
```

## 🚀 Development Workflow

1. **Setup Environment:**
   ```bash
   # Run setup script
   node setup-env.js
   
   # Or manually copy .env.example files
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

2. **Install Dependencies:**
   ```bash
   # Backend
   cd backend && npm install
   
   # Frontend  
   cd frontend && npm install
   ```

3. **Start Development Servers:**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev
   
   # Terminal 2 - Frontend
   cd frontend && npm start
   ```

4. **Access Application:**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000
   - API: http://localhost:5000/api/v1

## 🔧 Troubleshooting

### Common Issues:

**1. MongoDB Connection Error**
```
Error: MongoServerError: Authentication failed
```
**Solution:** Check your MongoDB URI and credentials

**2. Cloudinary Upload Error**
```
Error: Upload preset must be whitelisted
```
**Solution:** Verify your upload preset is set to "Unsigned" in Cloudinary settings

**3. CORS Error**
```
Access to fetch blocked by CORS policy
```
**Solution:** Check `CLIENT_URL` in backend .env matches frontend URL

**4. JWT Error**
```
JsonWebTokenError: invalid signature
```
**Solution:** Ensure JWT_SECRET is the same across all backend processes

### Environment Validation:

**Check Backend Environment:**
```bash
cd backend && node -e "
const config = require('./config/constants');
console.log('✅ Config loaded successfully');
console.log('MongoDB URI:', config.database.uri ? '✅ Set' : '❌ Missing');
console.log('JWT Secret:', config.jwt.secret !== 'fallback-secret-key-change-in-production' ? '✅ Set' : '⚠️ Using fallback');
console.log('Cloudinary:', config.cloudinary.cloudName ? '✅ Set' : '❌ Missing');
"
```

**Check Frontend Environment:**
```bash
cd frontend && node -e "
console.log('✅ Environment Variables:');
console.log('Server URL:', process.env.REACT_APP_SERVER_URL || '❌ Not set');
console.log('Cloudinary:', process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || '❌ Not set');
"
```

## 📞 Support

If you encounter issues:

1. Check this setup guide
2. Verify all environment variables are set correctly
3. Ensure all required services (MongoDB, Cloudinary) are configured
4. Check the console for detailed error messages

**Need help?** Open an issue with:
- Your environment setup
- Complete error messages  
- Steps to reproduce the issue

---

**⚠️ Remember:** Keep your `.env` files secure and never commit them to version control! 