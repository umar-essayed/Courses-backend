# 🚀 Sinceides Platform - Advanced LMS Backend

## 📋 Overview

Sinceides Platform is a comprehensive Learning Management System (LMS) backend built with modern technologies. This platform provides complete functionality for managing courses, lessons, users, and educational content with advanced features like video streaming, adaptive learning, and AI-powered recommendations.

## ✨ Key Features

### 🔐 Advanced Authentication & Security
- JWT-based authentication with refresh token rotation
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Rate limiting and security headers
- Input validation with Zod schemas

### 📚 Course & Content Management
- Create and manage courses with rich media
- Upload course banners and intro videos
- Lesson management with video content
- Automatic thumbnail generation
- File attachment support

### 🎥 Video Streaming & Processing
- Multi-quality video streaming (360p to 1080p)
- Automatic video compression
- Thumbnail generation from videos
- Cloudinary integration for CDN delivery
- Adaptive bitrate streaming

### 🧠 AI-Powered Features
- Personalized learning recommendations
- Adaptive content difficulty adjustment
- Learning pattern analysis
- Predictive analytics for course completion
- At-risk student identification

### 📊 Advanced Analytics
- User engagement metrics
- Course completion predictions
- Learning path optimization
- Performance analytics
- Risk assessment algorithms

### 🎯 Gamification
- Challenge system (Daily, Weekly, Monthly)
- Leaderboards and rankings
- Achievement tracking
- Progress monitoring

## 🏗️ Architecture

The platform uses a modular architecture for better maintainability:

```
api/
├── services.js      # Core services, repositories, and data models
├── main.js          # Advanced business logic and service implementations
├── api.js           # API endpoints, middleware, and controllers
├── index.ts         # Main entry point for Vercel deployment
└── config/          # Configuration files
```

## 🛠️ Technology Stack

### Backend Technologies
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Authentication**: JWT + Passport.js
- **Validation**: Zod schemas

### Database & Storage
- **Database**: Supabase (PostgreSQL)
- **File Storage**: Cloudinary
- **Cache**: Redis (Upstash)
- **Search**: Full-text search with Supabase

### DevOps & Deployment
- **Platform**: Vercel Serverless Functions
- **CI/CD**: GitHub Actions
- **Monitoring**: Built-in health checks
- **Documentation**: Swagger/OpenAPI 3.0

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- npm or yarn
- Supabase account
- Cloudinary account
- Upstash Redis account

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-username/sinceides-backend.git
cd sinceides-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp env.example .env
```

Edit `.env` with your configuration:
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
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

4. **Run the development server**
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

### Interactive Documentation
- **Development**: `http://localhost:3000/docs`
- **Production**: `https://your-domain.vercel.app/docs`

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout

#### Course Management
- `GET /api/courses` - Get public courses
- `POST /api/courses` - Create course (with file upload)
- `GET /api/courses/:id` - Get course details
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course

#### Lesson Management
- `POST /api/courses/:courseId/lessons` - Create lesson (with video upload)
- `GET /api/courses/:courseId/lessons` - Get course lessons
- `GET /api/courses/:courseId/lessons/:id` - Get lesson details
- `PUT /api/courses/:courseId/lessons/:id` - Update lesson
- `DELETE /api/courses/:courseId/lessons/:id` - Delete lesson

#### User Management
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `GET /api/users` - Get users list (Admin/HR)
- `PUT /api/users/:id/block` - Block user (Admin)

#### File Management
- `POST /api/upload` - Upload files
- `DELETE /api/files` - Delete files

### Complete API Reference
See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed endpoint documentation.

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `SUPABASE_URL` | Supabase project URL | ✅ | - |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | ✅ | - |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | ✅ | - |
| `CLOUDINARY_API_KEY` | Cloudinary API key | ✅ | - |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | ✅ | - |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL | ✅ | - |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token | ✅ | - |
| `JWT_SECRET` | JWT signing secret | ✅ | - |
| `JWT_REFRESH_SECRET` | JWT refresh secret | ✅ | - |
| `PORT` | Server port | ❌ | 3000 |
| `NODE_ENV` | Environment | ❌ | development |
| `CORS_ORIGIN` | CORS origin | ❌ | http://localhost:3000 |

### File Upload Limits
- **Maximum file size**: 50MB
- **Supported image types**: JPEG, PNG, WebP, GIF
- **Supported video types**: MP4, WebM, AVI, MOV
- **Supported document types**: PDF, DOC, DOCX

## 🚀 Deployment

### Vercel Deployment

1. **Connect Repository**
   - Connect your GitHub repository to Vercel
   - Import the project

2. **Configure Environment Variables**
   - Add all required environment variables in Vercel dashboard
   - Set `NODE_ENV=production`

3. **Deploy**
   - Deploy automatically on push to main branch
   - Or deploy manually from Vercel dashboard

### Manual Deployment

```bash
# Build the project
npm run build

# Start production server
npm start
```

## 🧪 Testing

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Authentication Test
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123","phoneNumber":"+1234567890","role":"student"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 📊 Monitoring & Analytics

### Built-in Health Checks
- Database connectivity
- Redis cache status
- Cloudinary service status
- API response times

### Logging
- Structured logging with Winston
- Request/response logging
- Error tracking
- Performance metrics

## 🔒 Security Features

### Authentication Security
- JWT token expiration
- Refresh token rotation
- Password strength validation
- Account lockout protection

### API Security
- Rate limiting (100 requests/15 minutes)
- CORS protection
- Helmet security headers
- Input sanitization
- SQL injection prevention

### File Upload Security
- File type validation
- File size limits
- Malware scanning (via Cloudinary)
- Secure file storage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Follow the existing code style
- Ensure all tests pass

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [API Documentation](./API_DOCUMENTATION.md)
- **Issues**: [GitHub Issues](https://github.com/your-username/sinceides-backend/issues)
- **Email**: support@sinceides.com
- **Discord**: [Join our community](https://discord.gg/sinceides)

## 🙏 Acknowledgments

- Supabase team for the amazing database platform
- Cloudinary for excellent media management
- Vercel for seamless deployment
- The open-source community for inspiration

---

**Version**: 2.0.0  
**Last Updated**: 2024-01-01  
**Maintained by**: Sinceides Development Team