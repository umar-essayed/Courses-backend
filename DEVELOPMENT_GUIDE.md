# 🚀 Sinceides Platform - Development Guide

## 📋 Prerequisites

Before you start developing, make sure you have the following installed:

- **Node.js** 18+ (recommended: use nvm)
- **npm** or **yarn**
- **Git**
- **VS Code** (recommended editor)

## 🛠️ Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/sinceides-backend.git
cd sinceides-backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup

#### Supabase Setup
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API
3. Copy your project URL and anon key
4. Go to Settings > Database
5. Copy your service role key

#### Cloudinary Setup
1. Create an account at [cloudinary.com](https://cloudinary.com)
2. Go to Dashboard
3. Copy your cloud name, API key, and API secret

#### Upstash Redis Setup
1. Create an account at [upstash.com](https://upstash.com)
2. Create a new Redis database
3. Copy your REST URL and token

### 4. Environment Variables
Create a `.env` file in the root directory:

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Redis Configuration
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# File Upload Configuration
MAX_FILE_SIZE=50MB
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp,image/gif
ALLOWED_VIDEO_TYPES=video/mp4,video/webm,video/avi,video/mov
ALLOWED_DOCUMENT_TYPES=application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document

# Video Processing Configuration
VIDEO_QUALITIES=360,480,720,1080
VIDEO_COMPRESSION_QUALITY=80
THUMBNAIL_GENERATION=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
BCRYPT_ROUNDS=12

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs/app.log
```

### 5. Database Setup
Run the SQL schema in your Supabase project:

```bash
# Copy the contents of supabase_schema.sql
# Paste and run in Supabase SQL Editor
```

### 6. Start Development Server
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## 📁 Project Structure

```
api/
├── services.js          # Core services, repositories, and data models
├── main.js              # Advanced business logic and service implementations
├── api.js               # API endpoints, middleware, and controllers
├── index.ts             # Main entry point for Vercel deployment
└── config/              # Configuration files (if any)

docs/
├── API_DOCUMENTATION.md # Complete API documentation
├── API_ENDPOINTS_MAP.md # Endpoints overview
└── DEVELOPMENT_GUIDE.md # This file

supabase_schema.sql      # Database schema
env.example             # Environment variables template
vercel.json             # Vercel deployment configuration
tsconfig.json           # TypeScript configuration
package.json            # Dependencies and scripts
README.md               # Project overview
```

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start development server with hot reload
npm run build            # Build the project
npm start                # Start production server

# Database
npm run seed             # Seed database with sample data
npm run snapshot         # Create database snapshot
npm run restore-snapshot # Restore from snapshot

# Deployment
npm run vercel-build     # Build for Vercel deployment
```

## 🧪 Testing

### Manual Testing

#### Health Check
```bash
curl http://localhost:3000/api/health
```

#### Authentication Flow
```bash
# Register a new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "phoneNumber": "+1234567890",
    "role": "student"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Use the returned access token for authenticated requests
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:3000/api/users/YOUR_USER_ID
```

#### File Upload Test
```bash
# Upload a file
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@/path/to/your/file.jpg"
```

### API Documentation
Visit `http://localhost:3000/docs` for interactive API documentation.

## 🔍 Debugging

### Logs
The application uses structured logging. Check the console output for:
- Request/response logs
- Error details
- Performance metrics

### Common Issues

#### Database Connection Issues
- Verify Supabase credentials
- Check if the database is accessible
- Ensure RLS policies are correctly set

#### File Upload Issues
- Verify Cloudinary credentials
- Check file size limits
- Ensure file types are allowed

#### Authentication Issues
- Verify JWT secrets are set
- Check token expiration
- Ensure user exists and is not blocked

## 🚀 Deployment

### Vercel Deployment

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository

2. **Configure Environment Variables**
   - Add all environment variables from your `.env` file
   - Set `NODE_ENV=production`

3. **Deploy**
   - Deploy automatically on push to main branch
   - Or deploy manually from Vercel dashboard

### Environment Variables for Production
Make sure to set these in Vercel:
- All Supabase credentials
- All Cloudinary credentials
- All Redis credentials
- JWT secrets (use strong, unique values)
- `NODE_ENV=production`
- `CORS_ORIGIN=https://your-frontend-domain.com`

## 📝 Code Style Guidelines

### TypeScript
- Use strict TypeScript settings
- Define interfaces for all data structures
- Use proper error handling
- Add JSDoc comments for complex functions

### API Design
- Follow RESTful conventions
- Use consistent response formats
- Implement proper error handling
- Add input validation

### Security
- Validate all inputs
- Use parameterized queries
- Implement proper authentication
- Follow OWASP guidelines

## 🔒 Security Best Practices

### Authentication
- Use strong JWT secrets
- Implement refresh token rotation
- Set appropriate token expiration times
- Validate all tokens

### Input Validation
- Validate all request data
- Sanitize user inputs
- Use Zod schemas for validation
- Implement file type validation

### Database Security
- Use Row Level Security (RLS)
- Implement proper access controls
- Use parameterized queries
- Regular security audits

## 🐛 Troubleshooting

### Common Errors

#### "Database connection failed"
- Check Supabase credentials
- Verify network connectivity
- Check RLS policies

#### "File upload failed"
- Check Cloudinary credentials
- Verify file size limits
- Check file type restrictions

#### "Authentication failed"
- Verify JWT secrets
- Check token expiration
- Ensure user is not blocked

#### "Rate limit exceeded"
- Check rate limiting configuration
- Implement proper caching
- Optimize API calls

### Performance Issues

#### Slow API responses
- Check database queries
- Implement caching
- Optimize file uploads
- Use connection pooling

#### High memory usage
- Check for memory leaks
- Optimize image processing
- Implement proper cleanup
- Monitor resource usage

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Vercel Documentation](https://vercel.com/docs)
- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Update documentation
6. Submit a pull request

### Pull Request Guidelines
- Include a clear description
- Add tests for new features
- Update documentation
- Ensure all tests pass
- Follow code style guidelines

## 🆘 Getting Help

- Check the [API Documentation](./API_DOCUMENTATION.md)
- Review the [README](./README.md)
- Open an issue on GitHub
- Contact the development team

---

**Happy Coding! 🚀**
