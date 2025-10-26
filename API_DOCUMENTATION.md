# 📚 Sinceides Platform API Documentation

## 🚀 Overview

Sinceides Platform is a comprehensive Learning Management System (LMS) built with modern technologies including Supabase, Cloudinary, and Vercel serverless functions. This API provides complete functionality for managing courses, lessons, users, and educational content.

## 🏗️ Architecture

The platform is built with a modular architecture:

- **`services.js`** - Core services, repositories, and data models
- **`main.js`** - Advanced business logic and service implementations  
- **`api.js`** - API endpoints, middleware, and controllers
- **`index.ts`** - Main entry point for Vercel deployment

## 🔧 Technology Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Database**: Supabase (PostgreSQL)
- **Storage**: Cloudinary (Images & Videos)
- **Cache**: Redis (Upstash)
- **Authentication**: JWT with Passport.js
- **Documentation**: Swagger/OpenAPI 3.0
- **Deployment**: Vercel Serverless Functions

## 🔐 Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Authentication Flow

1. **Register** - Create a new user account
2. **Login** - Get access and refresh tokens
3. **Refresh** - Get new access token using refresh token
4. **Logout** - Invalidate refresh token

## 📋 API Endpoints

### 🔐 Authentication Endpoints

#### POST `/api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phoneNumber": "+1234567890",
  "role": "student"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student"
    },
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

#### POST `/api/auth/login`
Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student"
    },
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

#### POST `/api/auth/refresh`
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "refresh-token"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "new-jwt-token",
    "refreshToken": "new-refresh-token"
  }
}
```

#### POST `/api/auth/logout`
Logout and invalidate refresh token.

**Request Body:**
```json
{
  "refreshToken": "refresh-token"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

### 👤 User Management Endpoints

#### GET `/api/users/:id`
Get user details by ID.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "+1234567890",
    "dateOfBirth": "1990-01-01",
    "country": "USA",
    "gender": "Male",
    "role": "student",
    "profilePictureUrl": "https://cloudinary.com/image.jpg",
    "isBlocked": false,
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
}
```

#### PUT `/api/users/:id`
Update user information.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Smith",
  "phoneNumber": "+1234567891",
  "country": "Canada"
}
```

#### GET `/api/users`
Get list of users (Admin/HR only).

**Headers:** `Authorization: Bearer <token>`
**Query Parameters:**
- `role` (optional): Filter by role
- `limit` (optional): Number of results (default: 100)
- `offset` (optional): Pagination offset (default: 0)

#### PUT `/api/users/:id/block`
Block a user (Admin only).

**Headers:** `Authorization: Bearer <token>`

#### PUT `/api/users/:id/unblock`
Unblock a user (Admin only).

**Headers:** `Authorization: Bearer <token>`

#### DELETE `/api/users/:id`
Soft delete a user (Admin only).

**Headers:** `Authorization: Bearer <token>`

#### POST `/api/users/:id/restore`
Restore a soft-deleted user (Admin only).

**Headers:** `Authorization: Bearer <token>`

### 📚 Course Management Endpoints

#### GET `/api/courses`
Get public courses list.

**Query Parameters:**
- `limit` (optional): Number of results (default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "uuid",
        "title": "JavaScript Fundamentals",
        "description": "Learn JavaScript from scratch",
        "thumbnailUrl": "https://cloudinary.com/thumbnail.jpg",
        "introVideoUrl": "https://cloudinary.com/intro.mp4",
        "instructorId": "uuid",
        "totalLessons": 10,
        "categoryId": "uuid",
        "language": "English",
        "level": "Beginner",
        "tags": ["javascript", "programming"],
        "price": 99.99,
        "duration": 1200,
        "rating": 4.5,
        "enrollmentCount": 150,
        "isPublished": true,
        "createdAt": "2023-01-01T00:00:00Z",
        "updatedAt": "2023-01-01T00:00:00Z"
      }
    ],
    "total": 1
  }
}
```

#### POST `/api/courses`
Create a new course (Instructor/Admin only).

**Headers:** `Authorization: Bearer <token>`
**Content-Type:** `multipart/form-data`

**Form Data:**
- `title`: Course title
- `description`: Course description
- `categoryId`: Category UUID
- `language`: Course language
- `level`: Course level (Beginner/Intermediate/Advanced)
- `tags`: JSON array of tags
- `price`: Course price (optional)
- `duration`: Course duration in minutes (optional)
- `thumbnail`: Course thumbnail image file
- `introVideo`: Course intro video file (optional)

#### GET `/api/courses/:id`
Get course details by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "JavaScript Fundamentals",
    "description": "Learn JavaScript from scratch",
    "thumbnailUrl": "https://cloudinary.com/thumbnail.jpg",
    "introVideoUrl": "https://cloudinary.com/intro.mp4",
    "instructorId": "uuid",
    "totalLessons": 10,
    "categoryId": "uuid",
    "language": "English",
    "level": "Beginner",
    "tags": ["javascript", "programming"],
    "price": 99.99,
    "duration": 1200,
    "rating": 4.5,
    "enrollmentCount": 150,
    "isPublished": true,
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
}
```

#### PUT `/api/courses/:id`
Update course (Instructor/Admin only).

**Headers:** `Authorization: Bearer <token>`
**Content-Type:** `multipart/form-data`

#### DELETE `/api/courses/:id`
Soft delete course (Instructor/Admin only).

**Headers:** `Authorization: Bearer <token>`

#### POST `/api/courses/:id/restore`
Restore soft-deleted course (Instructor/Admin only).

**Headers:** `Authorization: Bearer <token>`

### 📖 Lesson Management Endpoints

#### POST `/api/courses/:courseId/lessons`
Create a new lesson (Instructor only).

**Headers:** `Authorization: Bearer <token>`
**Content-Type:** `multipart/form-data`

**Form Data:**
- `title`: Lesson title
- `description`: Lesson description
- `durationMinutes`: Lesson duration
- `video`: Lesson video file
- `thumbnail`: Lesson thumbnail image file (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "courseId": "uuid",
    "lessonNumber": 1,
    "title": "Introduction to JavaScript",
    "description": "Basic JavaScript concepts",
    "videoUrl": "https://cloudinary.com/video.mp4",
    "thumbnailUrl": "https://cloudinary.com/thumbnail.jpg",
    "attachments": [],
    "instructorId": "uuid",
    "durationMinutes": 45,
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
}
```

#### GET `/api/courses/:courseId/lessons`
Get lessons for a course.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `limit` (optional): Number of results (default: 10)
- `offset` (optional): Pagination offset (default: 0)

#### GET `/api/courses/:courseId/lessons/:id`
Get specific lesson details.

**Headers:** `Authorization: Bearer <token>`

#### PUT `/api/courses/:courseId/lessons/:id`
Update lesson (Instructor only).

**Headers:** `Authorization: Bearer <token>`
**Content-Type:** `multipart/form-data`

#### DELETE `/api/courses/:courseId/lessons/:id`
Soft delete lesson (Instructor/Admin only).

**Headers:** `Authorization: Bearer <token>`

#### POST `/api/courses/:courseId/lessons/:id/restore`
Restore soft-deleted lesson (Instructor/Admin only).

**Headers:** `Authorization: Bearer <token>`

#### DELETE `/api/courses/:courseId/lessons/:id/permanent`
Permanently delete lesson (Admin only).

**Headers:** `Authorization: Bearer <token>`

### 🏷️ Category Management Endpoints

#### POST `/api/categories`
Create a new category (Admin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Programming",
  "description": "Programming courses and tutorials"
}
```

#### GET `/api/categories/:id`
Get category details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Programming",
    "description": "Programming courses and tutorials",
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
}
```

#### PUT `/api/categories/:id`
Update category (Admin only).

**Headers:** `Authorization: Bearer <token>`

#### DELETE `/api/categories/:id`
Soft delete category (Admin only).

**Headers:** `Authorization: Bearer <token>`

#### POST `/api/categories/:id/restore`
Restore soft-deleted category (Admin only).

**Headers:** `Authorization: Bearer <token>`

#### DELETE `/api/categories/:id/permanent`
Permanently delete category (Admin only).

**Headers:** `Authorization: Bearer <token>`

### 📝 Enrollment Management Endpoints

#### POST `/api/enrollments`
Enroll in a course.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "courseId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "courseId": "uuid",
    "lessonsCompleted": [],
    "rating": null,
    "completedAt": null,
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
}
```

#### PUT `/api/enrollments/progress`
Update enrollment progress.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "enrollmentId": "uuid",
  "lessonId": "uuid",
  "rating": 5
}
```

#### GET `/api/enrollments`
Get enrollments (Admin/HR only).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `userId` (optional): Filter by user ID
- `courseId` (optional): Filter by course ID
- `limit` (optional): Number of results (default: 100)
- `offset` (optional): Pagination offset (default: 0)

### 🎧 Support Endpoints

#### POST `/api/support/conversations`
Create a support conversation.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "supportId": null,
    "status": "open",
    "messages": [],
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
}
```

#### POST `/api/support/conversations/:id/messages`
Add message to support conversation.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "content": "I need help with my course"
}
```

### 👨‍💼 Admin Endpoints

#### GET `/api/admin/dashboard`
Get admin dashboard data (Admin only).

**Headers:** `Authorization: Bearer <token>`

### 👥 HR Endpoints

#### GET `/api/hr/instructors`
Get list of instructors (Admin/HR only).

**Headers:** `Authorization: Bearer <token>`

#### POST `/api/hr/assign-instructor`
Assign instructor to HR (Admin/HR only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "instructorId": "uuid",
  "hrId": "uuid"
}
```

### 🗑️ Bin Management Endpoints

#### GET `/api/bin`
Get deleted items (Admin only).

**Headers:** `Authorization: Bearer <token>`

#### POST `/api/:collection/:id/restore`
Restore deleted item (Admin only).

**Headers:** `Authorization: Bearer <token>`

#### DELETE `/api/:collection/:id/permanent`
Permanently delete item (Admin only).

**Headers:** `Authorization: Bearer <token>`

### 📁 File Management Endpoints

#### POST `/api/upload`
Upload a file.

**Headers:** `Authorization: Bearer <token>`
**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: File to upload

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://cloudinary.com/file.jpg",
    "originalName": "image.jpg",
    "mimetype": "image/jpeg",
    "size": 1024000
  }
}
```

#### DELETE `/api/files`
Delete a file.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "publicId": "cloudinary-public-id"
}
```

### 🏥 Health Check

#### GET `/api/health`
Check API health status.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2023-01-01T00:00:00Z",
    "version": "2.0.0",
    "environment": "development"
  }
}
```

## 🔑 User Roles & Permissions

### Role Hierarchy

1. **ADMIN** - Full system access
2. **INSTRUCTOR** - Course and lesson management
3. **HR** - User and instructor management
4. **STUDENT** - Course access and enrollment
5. **SUPPORT** - Support conversation management

### Permission Matrix

| Endpoint | ADMIN | INSTRUCTOR | HR | STUDENT | SUPPORT |
|----------|-------|------------|----|---------|---------| 
| `/api/users` | ✅ | ❌ | ✅ | ❌ | ❌ |
| `/api/courses` (POST) | ✅ | ✅ | ❌ | ❌ | ❌ |
| `/api/courses/:id/lessons` (POST) | ✅ | ✅ | ❌ | ❌ | ❌ |
| `/api/enrollments` (POST) | ✅ | ❌ | ❌ | ✅ | ❌ |
| `/api/support/conversations` | ✅ | ❌ | ❌ | ✅ | ✅ |

## 📊 Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "error": "Error message",
  "message": "Detailed error description",
  "details": [
    {
      "field": "fieldName",
      "message": "Validation error message"
    }
  ]
}
```

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Refresh token rotation
- Password hashing with bcrypt

### Rate Limiting
- 100 requests per 15 minutes per IP
- Configurable limits per endpoint

### Input Validation
- Zod schema validation
- File type and size restrictions
- SQL injection prevention

### Security Headers
- Helmet.js security headers
- CORS configuration
- Content Security Policy

## 📁 File Upload Support

### Supported File Types

**Images:**
- JPEG, PNG, WebP, GIF

**Videos:**
- MP4, WebM, AVI, MOV

**Documents:**
- PDF, DOC, DOCX

### File Size Limits
- Maximum file size: 50MB (configurable)
- Automatic compression for images
- Multiple quality variants for videos

### Cloudinary Integration
- Automatic image optimization
- Video transcoding
- Thumbnail generation
- CDN delivery

## 🚀 Deployment

### Environment Variables

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
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.com
```

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## 📚 API Documentation

Interactive API documentation is available at:
- **Development**: `http://localhost:3000/docs`
- **Production**: `https://your-domain.vercel.app/docs`

## 🐛 Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 413 | Payload Too Large - File too large |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

## 🔄 Pagination

Most list endpoints support pagination:

**Query Parameters:**
- `limit`: Number of items per page (default: 10, max: 100)
- `offset`: Number of items to skip (default: 0)

**Response Format:**
```json
{
  "success": true,
  "data": {
    "data": [...],
    "total": 150,
    "limit": 10,
    "offset": 0
  }
}
```

## 📈 Rate Limiting

- **Window**: 15 minutes
- **Limit**: 100 requests per IP
- **Headers**: Rate limit info included in response headers

## 🆘 Support

For API support and questions:
- **Email**: support@sinceides.com
- **Documentation**: `/docs` endpoint
- **Health Check**: `/api/health` endpoint

---

**Version**: 2.0.0  
**Last Updated**: 2024-01-01  
**Maintained by**: Sinceides Development Team
