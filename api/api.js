/**
 * Sinceides Platform - API Layer
 * This file contains all API endpoints, middleware, and controllers
 * Updated with enhanced security and comprehensive documentation
 */

import express, { Request, Response, NextFunction, Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { z } from 'zod';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import sharp from 'sharp';

// Import services and types
import {
  authService,
  userService,
  courseService,
  lessonService,
  examRepo,
  attemptRepo,
  certificateRepo,
  roadmapRepo,
  challengeRepo,
  learningProfileRepo,
  recommendationRepo,
  userRepo,
  courseRepo,
  lessonRepo,
  categoryRepo,
  enrollmentRepo,
  conversationRepo,
  refreshTokenRepo,
  activityLogRepo,
  cacheService,
  CloudinaryService,
  Role,
  Level,
  Status,
  ChallengeType,
  ChallengeStatus,
  ExamType,
  QuestionType,
  LearningStyle,
  ProficiencyLevel,
  registerSchema,
  loginSchema,
  refreshSchema,
  courseCreateSchema,
  lessonCreateSchema,
  assignInstructorSchema,
  UserDTO,
  CourseDTO,
  LessonDTO,
  CategoryDTO,
  EnrollmentDTO,
  SupportConversationDTO
} from './main.js';

// Import security and video processing
import SecurityConfig from './security.js';
import { videoProcessingService, videoStreamingService } from './video-processing.js';

// Types
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
  };
}

// Configuration
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const VERCEL_REGION = process.env.VERCEL_REGION || 'unknown';
const VERCEL_URL = process.env.VERCEL_URL || 'unknown';

// Initialize Express app
const app = express();

// Security Middleware
app.use(SecurityConfig.getHelmetConfig());

// CORS Configuration
app.use(SecurityConfig.getCorsConfig());

// Rate Limiting
app.use('/api', SecurityConfig.getRateLimitConfig());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// File upload configuration
const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allAllowedTypes = [
    ...SecurityConfig.ALLOWED_IMAGE_TYPES,
    ...SecurityConfig.ALLOWED_VIDEO_TYPES,
    ...SecurityConfig.ALLOWED_DOCUMENT_TYPES
  ];

  if (SecurityConfig.validateFileType(file.mimetype, allAllowedTypes)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE?.replace('MB', '') || '50') * 1024 * 1024 // Convert MB to bytes
  }
});

// Passport JWT Strategy
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET!
}, async (payload, done) => {
  try {
    const user = await userRepo.findById(payload.id);
    if (user && !user.isBlocked) {
      return done(null, {
        id: user.id,
        email: user.email,
        role: user.role
      });
    }
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
}));

// Middleware Classes
export class AuthMiddleware {
  static authenticate() {
    return passport.authenticate('jwt', { session: false });
  }

  static initializePassport() {
    passport.initialize();
  }
}

export class RBACMiddleware {
  static checkRole(roles: Role[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    };
  }
}

export class RequestIdMiddleware {
  static generate() {
    return (req: Request, res: Response, next: NextFunction) => {
      req.headers['x-request-id'] = req.headers['x-request-id'] || require('uuid').v4();
      res.setHeader('X-Request-ID', req.headers['x-request-id']);
      next();
    };
  }
}

export class UploadMiddleware {
  static setup() {
    return upload;
  }
}

export class ValidationMiddleware {
  static validate(schema: z.ZodSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        schema.parse(req.body);
        next();
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            error: 'Validation failed',
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          });
        }
        next(error);
      }
    };
  }
}

export class ErrorHandler {
  static handle() {
    return (error: any, req: Request, res: Response, next: NextFunction) => {
      console.error('Error:', error);

      // Multer errors
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: 'File too large',
          message: `Maximum file size is ${process.env.MAX_FILE_SIZE || '50MB'}`
        });
      }

      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          error: 'Unexpected file field',
          message: 'File field name is not expected'
        });
      }

      // Validation errors
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          error: 'Validation failed',
          message: error.message
        });
      }

      // JWT errors
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          error: 'Invalid token',
          message: 'Authentication token is invalid'
        });
      }

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token expired',
          message: 'Authentication token has expired'
        });
      }

      // Database errors
      if (error.code === '23505') { // Unique constraint violation
        return res.status(409).json({
          error: 'Conflict',
          message: 'Resource already exists'
        });
      }

      if (error.code === '23503') { // Foreign key constraint violation
        return res.status(400).json({
          error: 'Invalid reference',
          message: 'Referenced resource does not exist'
        });
      }

      // Default error
      const statusCode = error.statusCode || 500;
      const message = NODE_ENV === 'production' ? 'Internal server error' : error.message;

      res.status(statusCode).json({
        error: 'Internal server error',
        message,
        ...(NODE_ENV === 'development' && { stack: error.stack })
      });
    };
  }
}

// Controllers
export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const data = registerSchema.parse(req.body);
      const result = await authService.register(
        data.name,
        data.email,
        data.password,
        data.phoneNumber,
        data.role
      );
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const data = loginSchema.parse(req.body);
      const result = await authService.login(data.email, data.password);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  static async refreshToken(req: Request, res: Response) {
    try {
      const data = refreshSchema.parse(req.body);
      const result = await authService.refreshToken(data.refreshToken);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  static async logout(req: Request, res: Response) {
    try {
      const data = refreshSchema.parse(req.body);
      await authService.logout(data.refreshToken);
      res.json({ success: true, data: { message: 'Logged out successfully' } });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export class UserController {
  static async getUser(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.params.id;
      const user = await userService.getUserById(userId);
      res.json({ success: true, data: user });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  static async updateUser(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.params.id;
      const updateData = req.body;
      const user = await userService.updateUser(userId, updateData);
      res.json({ success: true, data: user });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async blockUser(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.params.id;
      const result = await userService.blockUser(userId);
      res.json({ success: true, data: { blocked: result } });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async unblockUser(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.params.id;
      const result = await userService.unblockUser(userId);
      res.json({ success: true, data: { unblocked: result } });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async softDeleteUser(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.params.id;
      const result = await userService.softDeleteUser(userId);
      res.json({ success: true, data: { deleted: result } });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async restoreUser(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.params.id;
      const result = await userService.restoreUser(userId);
      res.json({ success: true, data: { restored: result } });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getUserReport(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.params.id;
      // Implementation for user report
      res.json({ success: true, data: { message: 'User report feature coming soon' } });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const { role, limit = 100, offset = 0 } = req.query;
      const users = await userService.getUsers(
        role as Role,
        parseInt(limit as string),
        parseInt(offset as string)
      );
      res.json({ success: true, data: users });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export class CourseController {
  static async getCoursesPublic(req: Request, res: Response) {
    try {
      const { limit = 100, offset = 0 } = req.query;
      const result = await courseService.getCoursesPublic(
        parseInt(limit as string),
        parseInt(offset as string)
      );
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async createCourse(req: AuthenticatedRequest, res: Response) {
    try {
      const data = courseCreateSchema.parse(req.body);
      const thumbnailFile = req.files?.['thumbnail']?.[0];
      const introVideoFile = req.files?.['introVideo']?.[0];

      const course = await courseService.createCourse(
        data,
        thumbnailFile?.buffer,
        introVideoFile?.buffer
      );
      res.status(201).json({ success: true, data: course });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getCourse(req: Request, res: Response) {
    try {
      const courseId = req.params.id;
      const course = await courseService.getCourseById(courseId);
      res.json({ success: true, data: course });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  static async updateCourse(req: AuthenticatedRequest, res: Response) {
    try {
      const courseId = req.params.id;
      const data = req.body;
      const thumbnailFile = req.files?.['thumbnail']?.[0];
      const introVideoFile = req.files?.['introVideo']?.[0];

      const course = await courseService.updateCourse(
        courseId,
        data,
        thumbnailFile?.buffer,
        introVideoFile?.buffer
      );
      res.json({ success: true, data: course });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async softDeleteCourse(req: AuthenticatedRequest, res: Response) {
    try {
      const courseId = req.params.id;
      const result = await courseService.softDeleteCourse(courseId);
      res.json({ success: true, data: { deleted: result } });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async restoreCourse(req: AuthenticatedRequest, res: Response) {
    try {
      const courseId = req.params.id;
      const result = await courseService.restoreCourse(courseId);
      res.json({ success: true, data: { restored: result } });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export class LessonController {
  static async createLesson(req: AuthenticatedRequest, res: Response) {
    try {
      const courseId = req.params.courseId;
      const data = lessonCreateSchema.parse(req.body);
      const videoFile = req.files?.['video']?.[0];
      const thumbnailFile = req.files?.['thumbnail']?.[0];

      const lesson = await lessonService.createLesson(
        { ...data, courseId, instructorId: req.user!.id },
        videoFile?.buffer,
        thumbnailFile?.buffer
      );
      res.status(201).json({ success: true, data: lesson });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getLesson(req: AuthenticatedRequest, res: Response) {
    try {
      const lessonId = req.params.id;
      const lesson = await lessonService.getLessonById(lessonId);
      res.json({ success: true, data: lesson });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  static async updateLesson(req: AuthenticatedRequest, res: Response) {
    try {
      const lessonId = req.params.id;
      const data = req.body;
      const videoFile = req.files?.['video']?.[0];
      const thumbnailFile = req.files?.['thumbnail']?.[0];

      const lesson = await lessonService.updateLesson(
        lessonId,
        data,
        videoFile?.buffer,
        thumbnailFile?.buffer
      );
      res.json({ success: true, data: lesson });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async softDeleteLesson(req: AuthenticatedRequest, res: Response) {
    try {
      const lessonId = req.params.id;
      const result = await lessonService.softDeleteLesson(lessonId);
      res.json({ success: true, data: { deleted: result } });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async restoreLesson(req: AuthenticatedRequest, res: Response) {
    try {
      const lessonId = req.params.id;
      const result = await lessonService.restoreLesson(lessonId);
      res.json({ success: true, data: { restored: result } });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async permanentDeleteLesson(req: AuthenticatedRequest, res: Response) {
    try {
      const lessonId = req.params.id;
      const result = await lessonService.permanentDeleteLesson(lessonId);
      res.json({ success: true, data: { deleted: result } });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getLessonsByCourse(req: AuthenticatedRequest, res: Response) {
    try {
      const courseId = req.params.courseId;
      const { limit = 10, offset = 0 } = req.query;
      const result = await lessonService.getLessonsByCourse(
        courseId,
        parseInt(limit as string),
        parseInt(offset as string)
      );
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export class CategoryController {
  static async createCategory(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, description } = req.body;
      const category = await categoryRepo.create({ name, description });
      res.status(201).json({ success: true, data: category });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getCategory(req: Request, res: Response) {
    try {
      const categoryId = req.params.id;
      const category = await categoryRepo.findById(categoryId);
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
      res.json({ success: true, data: category });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async updateCategory(req: AuthenticatedRequest, res: Response) {
    try {
      const categoryId = req.params.id;
      const data = req.body;
      const category = await categoryRepo.update(categoryId, data);
      res.json({ success: true, data: category });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async softDeleteCategory(req: AuthenticatedRequest, res: Response) {
    try {
      const categoryId = req.params.id;
      const result = await categoryRepo.softDelete(categoryId);
      res.json({ success: true, data: { deleted: result } });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async restoreCategory(req: AuthenticatedRequest, res: Response) {
    try {
      const categoryId = req.params.id;
      const result = await categoryRepo.restore(categoryId);
      res.json({ success: true, data: { restored: result } });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async permanentDeleteCategory(req: AuthenticatedRequest, res: Response) {
    try {
      const categoryId = req.params.id;
      const result = await categoryRepo.permanentDelete(categoryId);
      res.json({ success: true, data: { deleted: result } });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export class EnrollmentController {
  static async enroll(req: AuthenticatedRequest, res: Response) {
    try {
      const { courseId } = req.body;
      const userId = req.user!.id;
      
      // Check if already enrolled
      const existingEnrollment = await enrollmentRepo.findByUserAndCourse(userId, courseId);
      if (existingEnrollment) {
        return res.status(409).json({ error: 'Already enrolled in this course' });
      }

      const enrollment = await enrollmentRepo.create({
        userId,
        courseId,
        lessonsCompleted: [],
        rating: null,
        completedAt: null
      });

      res.status(201).json({ success: true, data: enrollment });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async updateProgress(req: AuthenticatedRequest, res: Response) {
    try {
      const { enrollmentId, lessonId, rating } = req.body;
      
      const enrollment = await enrollmentRepo.findById(enrollmentId);
      if (!enrollment) {
        return res.status(404).json({ error: 'Enrollment not found' });
      }

      // Add lesson to completed lessons if not already there
      if (lessonId && !enrollment.lessonsCompleted.includes(lessonId)) {
        const updatedLessonsCompleted = [...enrollment.lessonsCompleted, lessonId];
        await enrollmentRepo.update(enrollmentId, { lessonsCompleted: updatedLessonsCompleted });
      }

      // Update rating if provided
      if (rating !== undefined) {
        await enrollmentRepo.update(enrollmentId, { rating });
      }

      res.json({ success: true, data: { message: 'Progress updated successfully' } });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export class SupportController {
  static async createConversation(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const conversation = await conversationRepo.create({
        userId,
        supportId: null,
        status: Status.OPEN,
        messages: []
      });
      res.status(201).json({ success: true, data: conversation });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async addMessage(req: AuthenticatedRequest, res: Response) {
    try {
      const conversationId = req.params.id;
      const { content } = req.body;
      const senderId = req.user!.id;

      const message = {
        id: require('uuid').v4(),
        senderId,
        content,
        timestamp: new Date().toISOString(),
        read: false
      };

      const result = await conversationRepo.addMessage(conversationId, message);
      res.json({ success: true, data: { added: result, message } });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export class AdminController {
  static async getDashboard(req: AuthenticatedRequest, res: Response) {
    try {
      // Implementation for admin dashboard
      res.json({ success: true, data: { message: 'Admin dashboard feature coming soon' } });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export class HrController {
  static async getInstructors(req: AuthenticatedRequest, res: Response) {
    try {
      const instructors = await userService.getUsers(Role.INSTRUCTOR);
      res.json({ success: true, data: instructors });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async assignInstructor(req: AuthenticatedRequest, res: Response) {
    try {
      const data = assignInstructorSchema.parse(req.body);
      const result = await userRepo.assignHr(data.instructorId, data.hrId);
      res.json({ success: true, data: { assigned: result } });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export class BinController {
  static async getDeletedItems(req: AuthenticatedRequest, res: Response) {
    try {
      // Implementation for getting deleted items
      res.json({ success: true, data: { message: 'Bin feature coming soon' } });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async restoreItem(req: AuthenticatedRequest, res: Response) {
    try {
      const { collection, id } = req.params;
      // Implementation for restoring items
      res.json({ success: true, data: { message: 'Restore feature coming soon' } });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async permanentDelete(req: AuthenticatedRequest, res: Response) {
    try {
      const { collection, id } = req.params;
      // Implementation for permanent deletion
      res.json({ success: true, data: { message: 'Permanent delete feature coming soon' } });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

// File Upload Controller
export class FileController {
  static async upload(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { buffer, mimetype, originalname } = req.file;
      let url = '';

      if (mimetype.startsWith('image/')) {
        url = await CloudinaryService.uploadImage(buffer, 'uploads/images');
      } else if (mimetype.startsWith('video/')) {
        url = await CloudinaryService.uploadVideo(buffer, 'uploads/videos');
      } else {
        return res.status(400).json({ error: 'Unsupported file type' });
      }

      res.json({
        success: true,
        data: {
          url,
          originalName: originalname,
          mimetype,
          size: buffer.length
        }
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async deleteFile(req: Request, res: Response) {
    try {
      const { publicId } = req.body;
      if (!publicId) {
        return res.status(400).json({ error: 'Public ID is required' });
      }

      const result = await CloudinaryService.deleteFile(publicId);
      res.json({ success: true, data: { deleted: result } });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

// Swagger Configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sinceides Platform API',
      version: '2.0.0',
      description: 'Comprehensive API documentation for Sinceides LMS Platform with Supabase and Cloudinary integration',
      contact: {
        name: 'Sinceides Team',
        email: 'support@sinceides.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://your-domain.vercel.app/api' 
          : `http://localhost:${PORT}/api`,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from login endpoint'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phoneNumber: { type: 'string' },
            dateOfBirth: { type: 'string', format: 'date' },
            country: { type: 'string' },
            gender: { type: 'string', enum: ['Male', 'Female', 'Other'] },
            role: { type: 'string', enum: ['admin', 'instructor', 'student', 'hr', 'support'] },
            profilePictureUrl: { type: 'string', format: 'uri', nullable: true },
            isBlocked: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Course: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            thumbnailUrl: { type: 'string', format: 'uri' },
            introVideoUrl: { type: 'string', format: 'uri', nullable: true },
            instructorId: { type: 'string', format: 'uuid' },
            totalLessons: { type: 'integer' },
            categoryId: { type: 'string', format: 'uuid' },
            language: { type: 'string' },
            level: { type: 'string', enum: ['Beginner', 'Intermediate', 'Advanced'] },
            tags: { type: 'array', items: { type: 'string' } },
            price: { type: 'number', nullable: true },
            duration: { type: 'number', nullable: true },
            rating: { type: 'number', nullable: true },
            enrollmentCount: { type: 'integer', nullable: true },
            isPublished: { type: 'boolean', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Lesson: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            courseId: { type: 'string', format: 'uuid' },
            lessonNumber: { type: 'integer' },
            title: { type: 'string' },
            description: { type: 'string' },
            videoUrl: { type: 'string', format: 'uri' },
            thumbnailUrl: { type: 'string', format: 'uri' },
            attachments: { type: 'array', items: { type: 'string' } },
            instructorId: { type: 'string', format: 'uuid' },
            durationMinutes: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            details: { type: 'array', items: { type: 'object' } }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./api.js'] // Path to the API file
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Initialize middleware
app.use(RequestIdMiddleware.generate());
app.use(AuthMiddleware.initializePassport());

// Swagger documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Sinceides Platform API Documentation'
}));

// API Routes
const apiRouter = Router();

// Authentication routes
apiRouter.post('/auth/register', ValidationMiddleware.validate(registerSchema), AuthController.register);
apiRouter.post('/auth/login', ValidationMiddleware.validate(loginSchema), AuthController.login);
apiRouter.post('/auth/refresh', ValidationMiddleware.validate(refreshSchema), AuthController.refreshToken);
apiRouter.post('/auth/logout', ValidationMiddleware.validate(refreshSchema), AuthController.logout);

// User routes
apiRouter.get('/users/:id', AuthMiddleware.authenticate(), UserController.getUser);
apiRouter.put('/users/:id', AuthMiddleware.authenticate(), UserController.updateUser);
apiRouter.get('/users/:id/report', AuthMiddleware.authenticate(), UserController.getUserReport);
apiRouter.delete('/users/:id', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.ADMIN]), UserController.softDeleteUser);
apiRouter.post('/users/:id/restore', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.ADMIN]), UserController.restoreUser);
apiRouter.put('/users/:id/block', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.ADMIN]), UserController.blockUser);
apiRouter.put('/users/:id/unblock', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.ADMIN]), UserController.unblockUser);
apiRouter.get('/users', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.ADMIN, Role.HR]), UserController.getUsers);

// Course routes
apiRouter.get('/courses', CourseController.getCoursesPublic);
apiRouter.post('/courses', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.ADMIN, Role.INSTRUCTOR]), UploadMiddleware.setup().fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'introVideo', maxCount: 1 }
]), ValidationMiddleware.validate(courseCreateSchema), CourseController.createCourse);
apiRouter.get('/courses/:id', CourseController.getCourse);
apiRouter.put('/courses/:id', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.ADMIN, Role.INSTRUCTOR]), UploadMiddleware.setup().fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'introVideo', maxCount: 1 }
]), CourseController.updateCourse);
apiRouter.delete('/courses/:id', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.ADMIN, Role.INSTRUCTOR]), CourseController.softDeleteCourse);
apiRouter.post('/courses/:id/restore', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.ADMIN, Role.INSTRUCTOR]), CourseController.restoreCourse);

// Lesson routes
apiRouter.post('/courses/:courseId/lessons', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.INSTRUCTOR]), UploadMiddleware.setup().fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), ValidationMiddleware.validate(lessonCreateSchema), LessonController.createLesson);
apiRouter.get('/courses/:courseId/lessons', AuthMiddleware.authenticate(), LessonController.getLessonsByCourse);
apiRouter.get('/courses/:courseId/lessons/:id', AuthMiddleware.authenticate(), LessonController.getLesson);
apiRouter.put('/courses/:courseId/lessons/:id', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.INSTRUCTOR]), UploadMiddleware.setup().fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), LessonController.updateLesson);
apiRouter.delete('/courses/:courseId/lessons/:id', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.ADMIN, Role.INSTRUCTOR]), LessonController.softDeleteLesson);
apiRouter.post('/courses/:courseId/lessons/:id/restore', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.ADMIN, Role.INSTRUCTOR]), LessonController.restoreLesson);
apiRouter.delete('/courses/:courseId/lessons/:id/permanent', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.ADMIN]), LessonController.permanentDeleteLesson);

// Category routes
apiRouter.post('/categories', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.ADMIN]), CategoryController.createCategory);
apiRouter.get('/categories/:id', CategoryController.getCategory);
apiRouter.put('/categories/:id', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.ADMIN]), CategoryController.updateCategory);
apiRouter.delete('/categories/:id', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.ADMIN]), CategoryController.softDeleteCategory);
apiRouter.post('/categories/:id/restore', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.ADMIN]), CategoryController.restoreCategory);
apiRouter.delete('/categories/:id/permanent', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.ADMIN]), CategoryController.permanentDeleteCategory);

// Enrollment routes
apiRouter.get('/enrollments', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.ADMIN, Role.HR]), async (req, res) => {
  try {
    const { userId, courseId } = req.query;
    if (userId && courseId) {
      const enrollment = await enrollmentRepo.findByUserAndCourse(userId as string, courseId as string);
      res.json({ success: true, data: enrollment });
    } else {
      const { limit = 100, offset = 0 } = req.query;
      const result = await enrollmentRepo.findMany({}, false, parseInt(limit as string), parseInt(offset as string));
      res.json({ success: true, data: result });
    }
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});
apiRouter.post('/enrollments', AuthMiddleware.authenticate(), EnrollmentController.enroll);
apiRouter.put('/enrollments/progress', AuthMiddleware.authenticate(), EnrollmentController.updateProgress);

// Support routes
apiRouter.post('/support/conversations', AuthMiddleware.authenticate(), SupportController.createConversation);
apiRouter.post('/support/conversations/:id/messages', AuthMiddleware.authenticate(), SupportController.addMessage);

// Admin routes
apiRouter.get('/admin/dashboard', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.ADMIN]), AdminController.getDashboard);

// HR routes
apiRouter.get('/hr/instructors', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.ADMIN, Role.HR]), HrController.getInstructors);
apiRouter.post('/hr/assign-instructor', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.ADMIN, Role.HR]), ValidationMiddleware.validate(assignInstructorSchema), HrController.assignInstructor);

// Bin routes
apiRouter.get('/bin', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.ADMIN]), BinController.getDeletedItems);
apiRouter.post('/:collection/:id/restore', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.ADMIN]), BinController.restoreItem);
apiRouter.delete('/:collection/:id/permanent', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.ADMIN]), BinController.permanentDelete);

// File upload routes
apiRouter.post('/upload', UploadMiddleware.setup().single('file'), FileController.upload);
apiRouter.delete('/files', FileController.deleteFile);

// Health check
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      environment: NODE_ENV
    }
  });
});

// Mount API routes
app.use('/api', apiRouter);

// Error handling middleware
app.use(ErrorHandler.handle());

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: [
      'GET /api/health',
      'GET /docs',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/courses',
      'POST /api/courses',
      'GET /api/users/:id'
    ]
  });
});

// Start server
if (NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/docs`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
  });
}

// Export for Vercel
export default app;
