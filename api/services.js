/**
 * Sinceides Platform - Services Layer
 * This file contains all business logic and service implementations
 * Updated to use Supabase and Cloudinary
 */

const { createClient } = require('@supabase/supabase-js');
const { v2: cloudinary } = require('cloudinary');
const Redis = require('ioredis');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const { z } = require('zod');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Initialize Redis
const redisClient = new Redis(process.env.UPSTASH_REDIS_REST_URL!, {
  password: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Enums
export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other',
}

export enum Role {
  ADMIN = 'admin',
  INSTRUCTOR = 'instructor',
  STUDENT = 'student',
  HR = 'hr',
  SUPPORT = 'support',
}

export enum Level {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced',
}

export enum Status {
  OPEN = 'open',
  CLOSED = 'closed',
  PENDING = 'pending',
}

export enum ChallengeType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

export enum ChallengeStatus {
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  ENDED = 'ended'
}

export enum ExamType {
  QUIZ = 'quiz',
  MIDTERM = 'midterm',
  FINAL = 'final'
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  ESSAY = 'essay'
}

export enum LearningStyle {
  VISUAL = 'visual',
  AUDITORY = 'auditory',
  KINESTHETIC = 'kinesthetic',
  READING_WRITING = 'reading_writing'
}

export enum ProficiencyLevel {
  NOVICE = 'novice',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

// Base Entity Interface
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// Core Interfaces
export interface User extends BaseEntity {
  name: string;
  email: string;
  passwordHash: string;
  phoneNumber: string;
  dateOfBirth: string;
  country: string;
  gender: Gender;
  role: Role;
  profilePictureUrl: string | null;
  enrolledCourseIds: string[];
  isBlocked: boolean;
  assignedHrId?: string | null;
  challengeSubmissions?: { [challengeId: string]: UserChallengeSubmission };
}

export interface Course extends BaseEntity {
  title: string;
  description: string;
  thumbnailUrl: string;
  introVideoUrl?: string;
  instructorId: string;
  totalLessons: number;
  categoryId: string;
  language: string;
  level: Level;
  studentIds: string[];
  tags: string[];
  firstPublishDate: string | null;
  price?: number;
  duration?: number;
  rating?: number;
  enrollmentCount?: number;
  isPublished?: boolean;
}

export interface Lesson extends BaseEntity {
  courseId: string;
  lessonNumber: number;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  attachments: string[];
  instructorId: string;
  durationMinutes: number;
}

export interface Exam extends BaseEntity {
  courseId: string;
  lessonId?: string;
  title: string;
  description: string;
  type: ExamType;
  durationMinutes: number;
  passingScore: number;
  questions: Question[];
  maxAttempts: number;
  availableFrom?: string;
  availableUntil?: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer?: number | string;
  points: number;
  explanation?: string;
}

export interface ExamAttempt extends BaseEntity {
  userId: string;
  examId: string;
  answers: { questionId: string, answer: string | number }[];
  score: number;
  passed: boolean;
  timeSpent: number;
}

export interface Certificate extends BaseEntity {
  userId: string;
  courseId: string;
  issueDate: string;
  certificateUrl: string;
  verificationCode: string;
  grade?: string;
}

export interface Category extends BaseEntity {
  name: string;
  description: string;
}

export interface Enrollment extends BaseEntity {
  userId: string;
  courseId: string;
  lessonsCompleted: string[];
  rating: number | null;
  completedAt: string | null;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface SupportConversation extends BaseEntity {
  userId: string;
  supportId: string | null;
  status: Status;
  messages: Message[];
}

export interface RefreshToken extends BaseEntity {
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface ActivityLog extends BaseEntity {
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  details: Record<string, any>;
}

export interface ChallengeQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  points: number;
  explanation?: string;
}

export interface LeaderboardEntry {
  userId: string;
  score: number;
  timeSpent: number;
  completedAt: string;
}

export interface Roadmap extends BaseEntity {
  title: string;
  description: string;
  thumbnailUrl: string;
  introVideoUrl: string;
  estimatedHours: number;
  difficulty: Level;
  categoryId: string;
  courseIds: string[];
  enrolledUserIds: string[];
  isPublished: boolean;
  tags: string[];
  instructorId: string;
  objectives: string[];
  prerequisites: string[];
}

export interface Challenge extends BaseEntity {
  title: string;
  description: string;
  type: ChallengeType;
  status: ChallengeStatus;
  startDate: string;
  endDate: string;
  questions: ChallengeQuestion[];
  totalPoints: number;
  durationMinutes: number;
  participants: string[];
  leaderboard: LeaderboardEntry[];
}

export interface UserChallengeSubmission {
  answers: number[];
  score: number;
  timeSpent: number;
  completedAt: string;
  rank?: number;
}

export interface LearningProfile extends BaseEntity {
  userId: string;
  learningStyle: LearningStyle;
  proficiencyLevel: ProficiencyLevel;
  preferredDifficulty: Level;
  dailyStudyTime: number;
  strengths: string[];
  weaknesses: string[];
  lastActiveTime: string;
  progressRate: number;
}

export interface Recommendation extends BaseEntity {
  userId: string;
  courseIds: string[];
  roadmapIds: string[];
  challengeIds: string[];
  confidenceScore: number;
  reason: string;
}

// DTOs
export class UserDTO {
  constructor(
    public id: string,
    public name: string,
    public email: string,
    public phoneNumber: string,
    public dateOfBirth: string,
    public country: string,
    public gender: Gender,
    public role: Role,
    public profilePictureUrl: string | null,
    public isBlocked: boolean,
    public createdAt: string,
    public updatedAt: string,
    public assignedHrId?: string | null
  ) {}
}

export class CourseDTO {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public thumbnailUrl: string,
    public introVideoUrl?: string,
    public instructorId: string,
    public totalLessons: number,
    public categoryId: string,
    public language: string,
    public level: Level,
    public tags: string[],
    public studentIds: string[],
    public firstPublishDate: string | null,
    public price?: number,
    public duration?: number,
    public rating?: number,
    public enrollmentCount?: number,
    public isPublished?: boolean,
    public createdAt: string,
    public updatedAt: string
  ) {}
}

export class LessonDTO {
  constructor(
    public id: string,
    public courseId: string,
    public lessonNumber: number,
    public title: string,
    public description: string,
    public videoUrl: string,
    public thumbnailUrl: string,
    public attachments: string[],
    public instructorId: string,
    public durationMinutes: number,
    public createdAt: string,
    public updatedAt: string
  ) {}
}

// Cloudinary Service
export class CloudinaryService {
  static async uploadImage(buffer: Buffer, folder: string = 'uploads'): Promise<string> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          quality: 'auto',
          format: 'auto'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result!.secure_url);
        }
      ).end(buffer);
    });
  }

  static async uploadVideo(buffer: Buffer, folder: string = 'videos'): Promise<string> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'video',
          quality: 'auto',
          format: 'mp4'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result!.secure_url);
        }
      ).end(buffer);
    });
  }

  static async generateVideoThumbnail(videoUrl: string): Promise<string> {
    return cloudinary.url(videoUrl, {
      resource_type: 'video',
      format: 'jpg',
      width: 640,
      height: 360,
      crop: 'fill',
      gravity: 'center'
    });
  }

  static async deleteFile(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  static async generateVideoQualities(videoUrl: string): Promise<{ [quality: string]: string }> {
    const qualities = ['360', '480', '720', '1080'];
    const qualityUrls: { [quality: string]: string } = {};

    for (const quality of qualities) {
      qualityUrls[quality] = cloudinary.url(videoUrl, {
        resource_type: 'video',
        quality: 'auto',
        width: parseInt(quality),
        format: 'mp4'
      });
    }

    return qualityUrls;
  }
}

// Cache Service
export class CacheService {
  constructor(private redisClient: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl: number = 3600): Promise<boolean> {
    try {
      await this.redisClient.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      await this.redisClient.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async delByPrefix(prefix: string): Promise<boolean> {
    try {
      const keys = await this.redisClient.keys(`${prefix}*`);
      if (keys.length > 0) {
        await this.redisClient.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('Cache delete by prefix error:', error);
      return false;
    }
  }
}

// Base Repository
export class BaseRepository<T extends BaseEntity> {
  constructor(protected tableName: string) {}

  protected getTable() {
    return supabase.from(this.tableName);
  }

  async create(data: Omit<T, keyof BaseEntity>): Promise<T> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const entity = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    } as T;

    const { data: result, error } = await this.getTable().insert(entity).select().single();
    
    if (error) throw new Error(`Failed to create ${this.tableName}: ${error.message}`);
    
    return result;
  }

  async findById(id: string, includeDeleted = false): Promise<T | null> {
    let query = this.getTable().select('*').eq('id', id);
    
    if (!includeDeleted) {
      query = query.is('deletedAt', null);
    }

    const { data, error } = await query.single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to find ${this.tableName}: ${error.message}`);
    }
    
    return data || null;
  }

  async findMany(
    filters: Record<string, any> = {},
    includeDeleted = false,
    limit = 10,
    offset = 0
  ): Promise<{ data: T[]; total: number }> {
    let query = this.getTable().select('*', { count: 'exact' });
    
    if (!includeDeleted) {
      query = query.is('deletedAt', null);
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    
    if (error) {
      throw new Error(`Failed to find ${this.tableName}: ${error.message}`);
    }
    
    return { data: data || [], total: count || 0 };
  }

  async update(id: string, data: Partial<Omit<T, keyof BaseEntity>>): Promise<T | null> {
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString()
    };

    const { data: result, error } = await this.getTable()
      .update(updateData)
      .eq('id', id)
      .is('deletedAt', null)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update ${this.tableName}: ${error.message}`);
    }
    
    return result;
  }

  async softDelete(id: string): Promise<boolean> {
    const { error } = await this.getTable()
      .update({ 
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .is('deletedAt', null);
    
    if (error) {
      throw new Error(`Failed to soft delete ${this.tableName}: ${error.message}`);
    }
    
    return true;
  }

  async restore(id: string): Promise<boolean> {
    const { error } = await this.getTable()
      .update({ 
        deletedAt: null,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .not('deletedAt', 'is', null);
    
    if (error) {
      throw new Error(`Failed to restore ${this.tableName}: ${error.message}`);
    }
    
    return true;
  }

  async permanentDelete(id: string): Promise<boolean> {
    const { error } = await this.getTable()
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Failed to permanently delete ${this.tableName}: ${error.message}`);
    }
    
    return true;
  }
}

// Specific Repositories
export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users');
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.getTable()
      .select('*')
      .eq('email', email)
      .is('deletedAt', null)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to find user by email: ${error.message}`);
    }
    
    return data || null;
  }

  async blockUser(id: string): Promise<boolean> {
    return !!(await this.update(id, { isBlocked: true }));
  }

  async unblockUser(id: string): Promise<boolean> {
    return !!(await this.update(id, { isBlocked: false }));
  }

  async assignHr(instructorId: string, hrId: string): Promise<boolean> {
    return !!(await this.update(instructorId, { assignedHrId: hrId }));
  }
}

export class CourseRepository extends BaseRepository<Course> {
  constructor() {
    super('courses');
  }

  async incrementTotalLessons(courseId: string): Promise<void> {
    const course = await this.findById(courseId);
    if (course) {
      await this.update(courseId, { totalLessons: course.totalLessons + 1 });
    }
  }

  async decrementTotalLessons(courseId: string): Promise<void> {
    const course = await this.findById(courseId);
    if (course && course.totalLessons > 0) {
      await this.update(courseId, { totalLessons: course.totalLessons - 1 });
    }
  }

  async getTopCourses(limit = 5): Promise<Course[]> {
    const { data, error } = await this.getTable()
      .select('*')
      .is('deletedAt', null)
      .eq('isPublished', true)
      .order('enrollmentCount', { ascending: false })
      .limit(limit);
    
    if (error) {
      throw new Error(`Failed to get top courses: ${error.message}`);
    }
    
    return data || [];
  }
}

export class LessonRepository extends BaseRepository<Lesson> {
  constructor() {
    super('lessons');
  }

  async createWithNumber(data: Omit<Lesson, keyof BaseEntity | 'lessonNumber'>): Promise<Lesson> {
    // Get the next lesson number for this course
    const { data: lessons } = await this.getTable()
      .select('lessonNumber')
      .eq('courseId', data.courseId)
      .is('deletedAt', null)
      .order('lessonNumber', { ascending: false })
      .limit(1);

    const nextNumber = lessons && lessons.length > 0 ? lessons[0].lessonNumber + 1 : 1;
    
    return this.create({
      ...data,
      lessonNumber: nextNumber
    });
  }

  async findByCourse(courseId: string): Promise<Lesson[]> {
    const { data, error } = await this.getTable()
      .select('*')
      .eq('courseId', courseId)
      .is('deletedAt', null)
      .order('lessonNumber', { ascending: true });
    
    if (error) {
      throw new Error(`Failed to find lessons by course: ${error.message}`);
    }
    
    return data || [];
  }
}

export class CategoryRepository extends BaseRepository<Category> {
  constructor() {
    super('categories');
  }
}

export class EnrollmentRepository extends BaseRepository<Enrollment> {
  constructor() {
    super('enrollments');
  }

  async findByUserAndCourse(userId: string, courseId: string): Promise<Enrollment | null> {
    const { data, error } = await this.getTable()
      .select('*')
      .eq('userId', userId)
      .eq('courseId', courseId)
      .is('deletedAt', null)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to find enrollment: ${error.message}`);
    }
    
    return data || null;
  }

  async findByUser(userId: string): Promise<Enrollment[]> {
    const { data, error } = await this.getTable()
      .select('*')
      .eq('userId', userId)
      .is('deletedAt', null);
    
    if (error) {
      throw new Error(`Failed to find enrollments by user: ${error.message}`);
    }
    
    return data || [];
  }
}

export class SupportConversationRepository extends BaseRepository<SupportConversation> {
  constructor() {
    super('support_conversations');
  }

  async assignSupportToConversation(conversationId: string, supportId: string): Promise<boolean> {
    return !!(await this.update(conversationId, { supportId }));
  }

  async addMessage(conversationId: string, message: Message): Promise<boolean> {
    const conversation = await this.findById(conversationId);
    if (!conversation) return false;

    const updatedMessages = [...conversation.messages, message];
    return !!(await this.update(conversationId, { messages: updatedMessages }));
  }

  async getMetrics(): Promise<{
    open: number;
    closed: number;
    averageMessages: number;
  }> {
    const { data, error } = await this.getTable()
      .select('status, messages')
      .is('deletedAt', null);
    
    if (error) {
      throw new Error(`Failed to get support metrics: ${error.message}`);
    }

    const conversations = data || [];
    const open = conversations.filter(c => c.status === Status.OPEN).length;
    const closed = conversations.filter(c => c.status === Status.CLOSED).length;
    const totalMessages = conversations.reduce((sum, c) => sum + c.messages.length, 0);
    const averageMessages = conversations.length > 0 ? totalMessages / conversations.length : 0;

    return { open, closed, averageMessages };
  }
}

export class RefreshTokenRepository extends BaseRepository<RefreshToken> {
  constructor() {
    super('refresh_tokens');
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    const { data, error } = await this.getTable()
      .select('*')
      .eq('token', token)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to find refresh token: ${error.message}`);
    }
    
    return data || null;
  }

  async invalidateToken(token: string): Promise<boolean> {
    const { error } = await this.getTable()
      .delete()
      .eq('token', token);
    
    if (error) {
      throw new Error(`Failed to invalidate refresh token: ${error.message}`);
    }
    
    return true;
  }
}

export class ActivityLogRepository extends BaseRepository<ActivityLog> {
  constructor() {
    super('activity_logs');
  }

  async log(
    userId: string,
    action: string,
    resourceType: string,
    resourceId: string | null = null,
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.create({
      userId,
      action,
      resourceType,
      resourceId,
      details
    });
  }
}

// Initialize repositories
export const userRepo = new UserRepository();
export const courseRepo = new CourseRepository();
export const lessonRepo = new LessonRepository();
export const categoryRepo = new CategoryRepository();
export const enrollmentRepo = new EnrollmentRepository();
export const conversationRepo = new SupportConversationRepository();
export const refreshTokenRepo = new RefreshTokenRepository();
export const activityLogRepo = new ActivityLogRepository();

// Initialize cache service
export const cacheService = new CacheService(redisClient);

// Validation Schemas
export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  phoneNumber: z.string().min(10).max(15),
  role: z.nativeEnum(Role)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1)
});

export const courseCreateSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  categoryId: z.string().uuid(),
  language: z.string().min(2).max(10),
  level: z.nativeEnum(Level),
  tags: z.array(z.string()).optional(),
  price: z.number().min(0).optional(),
  duration: z.number().min(1).optional()
});

export const lessonCreateSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  durationMinutes: z.number().min(1).max(600)
});

export const assignInstructorSchema = z.object({
  instructorId: z.string().uuid(),
  hrId: z.string().uuid()
});

module.exports = {
  supabase,
  cloudinary,
  redisClient,
  cacheService,
  userRepo,
  courseRepo,
  lessonRepo,
  categoryRepo,
  enrollmentRepo,
  conversationRepo,
  refreshTokenRepo,
  activityLogRepo,
  CloudinaryService,
  User,
  Course,
  Lesson,
  Category,
  Enrollment,
  SupportConversation,
  RefreshToken,
  ActivityLog,
  UserDTO,
  CourseDTO,
  LessonDTO,
  CategoryDTO,
  EnrollmentDTO,
  SupportConversationDTO,
  Gender,
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
  assignInstructorSchema
};
