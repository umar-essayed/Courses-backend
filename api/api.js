/**
 * Sinceides Platform - Main API Application
 * Express.js application with Supabase and Cloudinary integration
 * Optimized for Vercel serverless functions
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const { z } = require('zod');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const sharp = require('sharp');

// Import services and types
const {
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
} = require('./main.js');

// Import security and video processing
const SecurityConfig = require('./security.js');
const { videoProcessingService, videoStreamingService } = require('./video-processing.js');

// Configuration
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const VERCEL_REGION = process.env.VERCEL_REGION || 'unknown';
const VERCEL_URL = process.env.VERCEL_URL || 'unknown';

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet(SecurityConfig.helmetConfig));
app.use(cors(SecurityConfig.corsConfig));

// Compression middleware
app.use(compression());

// Request logging
if (NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit(SecurityConfig.rateLimitConfig);
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Passport configuration
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
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

// Middleware classes
class AuthMiddleware {
  static authenticate() {
    return passport.authenticate('jwt', { session: false });
  }

  static initializePassport() {
    passport.initialize();
  }
}

class RequestIdMiddleware {
  static generate() {
    return (req, res, next) => {
      req.requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      res.setHeader('X-Request-ID', req.requestId);
      next();
    };
  }
}

class UploadMiddleware {
  static processImage() {
    return async (req, res, next) => {
      if (req.file) {
        try {
          const processedBuffer = await sharp(req.file.buffer)
            .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toBuffer();
          req.file.buffer = processedBuffer;
        } catch (error) {
          return res.status(400).json({ error: 'Image processing failed' });
        }
      }
      next();
    };
  }
}

class ValidationMiddleware {
  static validate(schema) {
    return (req, res, next) => {
      try {
        schema.parse(req.body);
        next();
      } catch (error) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
    };
  }
}

class ErrorHandler {
  static handle() {
    return (error, req, res, next) => {
      console.error('Error:', error);
      
      if (error.name === 'ValidationError') {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      
      if (error.name === 'UnauthorizedError') {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    };
  }
}

// File upload configuration
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
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
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

// Initialize passport
AuthMiddleware.initializePassport();

// API Router
const apiRouter = express.Router();

// Controllers
class AuthController {
  static async register(req, res) {
    try {
      const userData = registerSchema.parse(req.body);
      const user = await authService.register(userData);
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async login(req, res) {
    try {
      const credentials = loginSchema.parse(req.body);
      const result = await authService.login(credentials);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }

  static async refreshToken(req, res) {
    try {
      const { refreshToken } = refreshSchema.parse(req.body);
      const result = await authService.refreshToken(refreshToken);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }

  static async logout(req, res) {
    try {
      const { refreshToken } = req.body;
      await authService.logout(refreshToken);
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

class UserController {
  static async getUser(req, res) {
    try {
      const user = await userService.getUserById(req.user.id);
      res.json({ success: true, data: user });
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  static async updateUser(req, res) {
    try {
      const user = await userService.updateUser(req.user.id, req.body);
      res.json({ success: true, data: user });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async blockUser(req, res) {
    try {
      const { userId } = req.params;
      await userService.blockUser(userId);
      res.json({ success: true, message: 'User blocked successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async unblockUser(req, res) {
    try {
      const { userId } = req.params;
      await userService.unblockUser(userId);
      res.json({ success: true, message: 'User unblocked successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async softDeleteUser(req, res) {
    try {
      const { userId } = req.params;
      await userService.softDeleteUser(userId);
      res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async restoreUser(req, res) {
    try {
      const { userId } = req.params;
      await userService.restoreUser(userId);
      res.json({ success: true, message: 'User restored successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getUserReport(req, res) {
    try {
      const { userId } = req.params;
      const report = await userService.getUserReport(userId);
      res.json({ success: true, data: report });
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  static async getUsers(req, res) {
    try {
      const { page = 1, limit = 10, role, status } = req.query;
      const users = await userService.getUsers({ page, limit, role, status });
      res.json({ success: true, data: users });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

class CourseController {
  static async getCoursesPublic(req, res) {
    try {
      const { page = 1, limit = 10, category, level, search } = req.query;
      const courses = await courseService.getCoursesPublic({ page, limit, category, level, search });
      res.json({ success: true, data: courses });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async createCourse(req, res) {
    try {
      const courseData = courseCreateSchema.parse(req.body);
      const course = await courseService.createCourse(req.user.id, courseData, req.file);
      res.status(201).json({ success: true, data: course });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getCourse(req, res) {
    try {
      const { courseId } = req.params;
      const course = await courseService.getCourseById(courseId);
      res.json({ success: true, data: course });
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  static async updateCourse(req, res) {
    try {
      const { courseId } = req.params;
      const course = await courseService.updateCourse(courseId, req.body, req.file);
      res.json({ success: true, data: course });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async softDeleteCourse(req, res) {
    try {
      const { courseId } = req.params;
      await courseService.softDeleteCourse(courseId);
      res.json({ success: true, message: 'Course deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async restoreCourse(req, res) {
    try {
      const { courseId } = req.params;
      await courseService.restoreCourse(courseId);
      res.json({ success: true, message: 'Course restored successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

class LessonController {
  static async createLesson(req, res) {
    try {
      const lessonData = lessonCreateSchema.parse(req.body);
      const lesson = await lessonService.createLesson(req.user.id, lessonData, req.files);
      res.status(201).json({ success: true, data: lesson });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getLesson(req, res) {
    try {
      const { lessonId } = req.params;
      const lesson = await lessonService.getLessonById(lessonId);
      res.json({ success: true, data: lesson });
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  static async updateLesson(req, res) {
    try {
      const { lessonId } = req.params;
      const lesson = await lessonService.updateLesson(lessonId, req.body, req.files);
      res.json({ success: true, data: lesson });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async softDeleteLesson(req, res) {
    try {
      const { lessonId } = req.params;
      await lessonService.softDeleteLesson(lessonId);
      res.json({ success: true, message: 'Lesson deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async restoreLesson(req, res) {
    try {
      const { lessonId } = req.params;
      await lessonService.restoreLesson(lessonId);
      res.json({ success: true, message: 'Lesson restored successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async permanentDeleteLesson(req, res) {
    try {
      const { lessonId } = req.params;
      await lessonService.permanentDeleteLesson(lessonId);
      res.json({ success: true, message: 'Lesson permanently deleted' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getLessonsByCourse(req, res) {
    try {
      const { courseId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const lessons = await lessonService.getLessonsByCourse(courseId, { page, limit });
      res.json({ success: true, data: lessons });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

class CategoryController {
  static async createCategory(req, res) {
    try {
      const category = await categoryRepo.create(req.body);
      res.status(201).json({ success: true, data: category });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getCategory(req, res) {
    try {
      const { categoryId } = req.params;
      const category = await categoryRepo.findById(categoryId);
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
      res.json({ success: true, data: category });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async updateCategory(req, res) {
    try {
      const { categoryId } = req.params;
      const category = await categoryRepo.update(categoryId, req.body);
      res.json({ success: true, data: category });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async softDeleteCategory(req, res) {
    try {
      const { categoryId } = req.params;
      await categoryRepo.softDelete(categoryId);
      res.json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async restoreCategory(req, res) {
    try {
      const { categoryId } = req.params;
      await categoryRepo.restore(categoryId);
      res.json({ success: true, message: 'Category restored successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async permanentDeleteCategory(req, res) {
    try {
      const { categoryId } = req.params;
      await categoryRepo.permanentDelete(categoryId);
      res.json({ success: true, message: 'Category permanently deleted' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

class EnrollmentController {
  static async enroll(req, res) {
    try {
      const { courseId } = req.params;
      const enrollment = await enrollmentRepo.create({
        userId: req.user.id,
        courseId,
        enrolledAt: new Date(),
        status: Status.ACTIVE
      });
      res.status(201).json({ success: true, data: enrollment });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async updateProgress(req, res) {
    try {
      const { enrollmentId } = req.params;
      const { lessonId, completed, rating } = req.body;
      
      const enrollment = await enrollmentRepo.findById(enrollmentId);
      if (!enrollment) {
        return res.status(404).json({ error: 'Enrollment not found' });
      }

      if (lessonId && !enrollment.lessonsCompleted.includes(lessonId)) {
        enrollment.lessonsCompleted.push(lessonId);
      }

      if (rating !== undefined) {
        enrollment.rating = rating;
      }

      const updatedEnrollment = await enrollmentRepo.update(enrollmentId, enrollment);
      res.json({ success: true, data: updatedEnrollment });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

class SupportController {
  static async createConversation(req, res) {
    try {
      const userId = req.user.id;
      const conversation = await conversationRepo.create({
        userId,
        supportId: null,
        status: Status.OPEN,
        messages: []
      });
      res.status(201).json({ success: true, data: conversation });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async addMessage(req, res) {
    try {
      const { conversationId } = req.params;
      const { message, senderType } = req.body;
      
      const conversation = await conversationRepo.findById(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      conversation.messages.push({
        id: Date.now().toString(),
        message,
        senderType,
        timestamp: new Date()
      });

      const updatedConversation = await conversationRepo.update(conversationId, conversation);
      res.json({ success: true, data: updatedConversation });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

class AdminController {
  static async getDashboard(req, res) {
    try {
      const dashboard = await userService.getDashboard();
      res.json({ success: true, data: dashboard });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

class HrController {
  static async getInstructors(req, res) {
    try {
      const instructors = await userService.getInstructors();
      res.json({ success: true, data: instructors });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async assignInstructor(req, res) {
    try {
      const { courseId } = req.params;
      const { instructorId } = assignInstructorSchema.parse(req.body);
      await courseService.assignInstructor(courseId, instructorId);
      res.json({ success: true, message: 'Instructor assigned successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

class BinController {
  static async getDeletedItems(req, res) {
    try {
      const { type } = req.query;
      const items = await userService.getDeletedItems(type);
      res.json({ success: true, data: items });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async restoreItem(req, res) {
    try {
      const { type, id } = req.params;
      await userService.restoreItem(type, id);
      res.json({ success: true, message: 'Item restored successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async permanentDelete(req, res) {
    try {
      const { type, id } = req.params;
      await userService.permanentDelete(type, id);
      res.json({ success: true, message: 'Item permanently deleted' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

class FileController {
  static async upload(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const result = await CloudinaryService.uploadFile(req.file.buffer, {
        folder: 'sinceides',
        resource_type: 'auto'
      });

      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async deleteFile(req, res) {
    try {
      const { publicId } = req.params;
      if (!publicId) {
        return res.status(400).json({ error: 'Public ID is required' });
      }

      await CloudinaryService.deleteFile(publicId);
      res.json({ success: true, message: 'File deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

// RBAC Middleware
class RBACMiddleware {
  static checkRole(roles) {
    return (req, res, next) => {
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

// Routes
// Auth routes
apiRouter.post('/auth/register', ValidationMiddleware.validate(registerSchema), AuthController.register);
apiRouter.post('/auth/login', ValidationMiddleware.validate(loginSchema), AuthController.login);
apiRouter.post('/auth/refresh', ValidationMiddleware.validate(refreshSchema), AuthController.refreshToken);
apiRouter.post('/auth/logout', AuthController.logout);

// User routes
apiRouter.get('/users/me', AuthMiddleware.authenticate(), UserController.getUser);
apiRouter.put('/users/me', AuthMiddleware.authenticate(), UserController.updateUser);
apiRouter.get('/users', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.ADMIN, Role.HR]), UserController.getUsers);
apiRouter.put('/users/:userId/block', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.ADMIN, Role.HR]), UserController.blockUser);
apiRouter.put('/users/:userId/unblock', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.ADMIN, Role.HR]), UserController.unblockUser);
apiRouter.delete('/users/:userId', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.ADMIN, Role.HR]), UserController.softDeleteUser);
apiRouter.put('/users/:userId/restore', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.ADMIN, Role.HR]), UserController.restoreUser);
apiRouter.get('/users/:userId/report', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.ADMIN, Role.HR]), UserController.getUserReport);

// Course routes
apiRouter.get('/courses', CourseController.getCoursesPublic);
apiRouter.post('/courses', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.INSTRUCTOR, Role.ADMIN]), upload.single('banner'), UploadMiddleware.processImage(), ValidationMiddleware.validate(courseCreateSchema), CourseController.createCourse);
apiRouter.get('/courses/:courseId', CourseController.getCourse);
apiRouter.put('/courses/:courseId', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.INSTRUCTOR, Role.ADMIN]), upload.single('banner'), UploadMiddleware.processImage(), CourseController.updateCourse);
apiRouter.delete('/courses/:courseId', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.INSTRUCTOR, Role.ADMIN]), CourseController.softDeleteCourse);
apiRouter.put('/courses/:courseId/restore', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.INSTRUCTOR, Role.ADMIN]), CourseController.restoreCourse);

// Lesson routes
apiRouter.post('/lessons', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.INSTRUCTOR, Role.ADMIN]), upload.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), ValidationMiddleware.validate(lessonCreateSchema), LessonController.createLesson);
apiRouter.get('/lessons/:lessonId', AuthMiddleware.authenticate(), LessonController.getLesson);
apiRouter.put('/lessons/:lessonId', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.INSTRUCTOR, Role.ADMIN]), upload.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), LessonController.updateLesson);
apiRouter.delete('/lessons/:lessonId', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.INSTRUCTOR, Role.ADMIN]), LessonController.softDeleteLesson);
apiRouter.put('/lessons/:lessonId/restore', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.INSTRUCTOR, Role.ADMIN]), LessonController.restoreLesson);
apiRouter.delete('/lessons/:lessonId/permanent', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.ADMIN]), LessonController.permanentDeleteLesson);
apiRouter.get('/courses/:courseId/lessons', AuthMiddleware.authenticate(), LessonController.getLessonsByCourse);

// Category routes
apiRouter.post('/categories', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.ADMIN]), CategoryController.createCategory);
apiRouter.get('/categories/:categoryId', CategoryController.getCategory);
apiRouter.put('/categories/:categoryId', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.ADMIN]), CategoryController.updateCategory);
apiRouter.delete('/categories/:categoryId', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.ADMIN]), CategoryController.softDeleteCategory);
apiRouter.put('/categories/:categoryId/restore', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.ADMIN]), CategoryController.restoreCategory);
apiRouter.delete('/categories/:categoryId/permanent', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.ADMIN]), CategoryController.permanentDeleteCategory);

// Enrollment routes
apiRouter.post('/enrollments/:courseId', AuthMiddleware.authenticate(), EnrollmentController.enroll);
apiRouter.put('/enrollments/:enrollmentId/progress', AuthMiddleware.authenticate(), EnrollmentController.updateProgress);

// Support routes
apiRouter.post('/support/conversations', AuthMiddleware.authenticate(), SupportController.createConversation);
apiRouter.post('/support/conversations/:conversationId/messages', AuthMiddleware.authenticate(), SupportController.addMessage);

// Admin routes
apiRouter.get('/admin/dashboard', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.ADMIN]), AdminController.getDashboard);

// HR routes
apiRouter.get('/hr/instructors', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.HR, Role.ADMIN]), HrController.getInstructors);
apiRouter.post('/hr/courses/:courseId/assign-instructor', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.HR, Role.ADMIN]), ValidationMiddleware.validate(assignInstructorSchema), HrController.assignInstructor);

// Bin routes
apiRouter.get('/bin', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.ADMIN]), BinController.getDeletedItems);
apiRouter.put('/bin/:type/:id/restore', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.ADMIN]), BinController.restoreItem);
apiRouter.delete('/bin/:type/:id/permanent', AuthMiddleware.authenticate(), RBACMiddleware.checkRole([Role.ADMIN]), BinController.permanentDelete);

// File routes
apiRouter.post('/files/upload', upload.single('file'), FileController.upload);
apiRouter.delete('/files/:publicId', FileController.deleteFile);

// Health check
apiRouter.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      environment: NODE_ENV,
      vercel: {
        region: VERCEL_REGION,
        url: VERCEL_URL
      }
    }
  });
});

// Swagger documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sinceides Platform API',
      version: '2.0.0',
      description: 'Advanced Learning Management System with Supabase and Cloudinary'
    },
    servers: [
      {
        url: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://localhost:${PORT}`,
        description: 'API Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./api/api.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
apiRouter.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Apply middleware
app.use(RequestIdMiddleware.generate());
app.use('/api', apiRouter);

// Error handling
app.use(ErrorHandler.handle());

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Export for Vercel
module.exports = app;
