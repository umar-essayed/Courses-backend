/**
 * Sinceides Platform - Main Services Layer
 * This file contains advanced business logic and service implementations
 * Updated to use Supabase and Cloudinary with enhanced security
 */

import {
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
} from './services.js';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { z } from 'zod';

// Additional Interfaces
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

export interface AtRiskStudent {
  userId: string;
  userName: string;
  email: string;
  completionProbability: number;
  riskFactors: string[];
  recommendedInterventions: string[];
  lastActivity: string;
}

export interface LearningPath extends BaseEntity {
  userId: string;
  goal: string;
  estimatedCompletion: string;
  courses: {
    courseId: string;
    order: number;
    expectedStart: string;
    expectedEnd: string;
    status: 'pending' | 'in-progress' | 'completed';
  }[];
  progress: number;
}

export interface EngagementMetric extends BaseEntity {
  userId: string;
  courseId: string;
  totalTimeSpent: number;
  videoCompletionRate: number;
  quizAttempts: number;
  discussionParticipation: number;
  resourceDownloads: number;
  lastEngagement: string;
}

export interface AdaptiveContent extends BaseEntity {
  courseId: string;
  lessonId: string;
  difficultyVariants: {
    level: Level;
    content: string;
    resources: string[];
    durationMinutes: number;
  }[];
}

export interface PredictiveAnalytic extends BaseEntity {
  userId: string;
  courseId: string;
  completionProbability: number;
  predictedGrade: string;
  riskFactors: string[];
  recommendedInterventions: string[];
}

export interface StudyGroup extends BaseEntity {
  courseId: string;
  name: string;
  memberIds: string[];
  meetingSchedule: {
    day: string;
    time: string;
    frequency: 'weekly' | 'biweekly';
  };
  sharedResources: string[];
  discussionThreads: {
    id: string;
    userId: string;
    message: string;
    timestamp: string;
    replies: {
      userId: string;
      message: string;
      timestamp: string;
    }[];
  }[];
}

export interface PeerReview extends BaseEntity {
  assignmentId: string;
  reviewerId: string;
  revieweeId: string;
  criteria: {
    name: string;
    score: number;
    feedback: string;
  }[];
  overallScore: number;
  overallFeedback: string;
  submittedAt: string;
}

export interface NotificationPreference extends BaseEntity {
  userId: string;
  notificationTypes: {
    type: string;
    enabled: boolean;
    preferredTime?: string;
    channel: 'email' | 'push' | 'both';
  }[];
  quietHours: {
    start: string;
    end: string;
  };
  weeklyDigest: boolean;
  activitySummary: boolean;
}

// Additional Repositories
export class ExamRepository extends BaseRepository<Exam> {
  constructor() {
    super('exams');
  }

  async findByCourse(courseId: string): Promise<Exam[]> {
    const { data, error } = await this.getTable()
      .select('*')
      .eq('courseId', courseId)
      .is('deletedAt', null);
    
    if (error) {
      throw new Error(`Failed to find exams by course: ${error.message}`);
    }
    
    return data || [];
  }

  async findByLesson(lessonId: string): Promise<Exam[]> {
    const { data, error } = await this.getTable()
      .select('*')
      .eq('lessonId', lessonId)
      .is('deletedAt', null);
    
    if (error) {
      throw new Error(`Failed to find exams by lesson: ${error.message}`);
    }
    
    return data || [];
  }
}

export class ExamAttemptRepository extends BaseRepository<ExamAttempt> {
  constructor() {
    super('exam_attempts');
  }

  async findByUserAndExam(userId: string, examId: string): Promise<ExamAttempt[]> {
    const { data, error } = await this.getTable()
      .select('*')
      .eq('userId', userId)
      .eq('examId', examId)
      .is('deletedAt', null);
    
    if (error) {
      throw new Error(`Failed to find exam attempts: ${error.message}`);
    }
    
    return data || [];
  }

  async findByUser(userId: string): Promise<ExamAttempt[]> {
    const { data, error } = await this.getTable()
      .select('*')
      .eq('userId', userId)
      .is('deletedAt', null);
    
    if (error) {
      throw new Error(`Failed to find exam attempts by user: ${error.message}`);
    }
    
    return data || [];
  }
}

export class CertificateRepository extends BaseRepository<Certificate> {
  constructor() {
    super('certificates');
  }

  async findByUser(userId: string): Promise<Certificate[]> {
    const { data, error } = await this.getTable()
      .select('*')
      .eq('userId', userId)
      .is('deletedAt', null);
    
    if (error) {
      throw new Error(`Failed to find certificates by user: ${error.message}`);
    }
    
    return data || [];
  }

  async findByCourse(courseId: string): Promise<Certificate[]> {
    const { data, error } = await this.getTable()
      .select('*')
      .eq('courseId', courseId)
      .is('deletedAt', null);
    
    if (error) {
      throw new Error(`Failed to find certificates by course: ${error.message}`);
    }
    
    return data || [];
  }

  async findByVerificationCode(code: string): Promise<Certificate | null> {
    const { data, error } = await this.getTable()
      .select('*')
      .eq('verificationCode', code)
      .is('deletedAt', null)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to find certificate by verification code: ${error.message}`);
    }
    
    return data || null;
  }
}

export class RoadmapRepository extends BaseRepository<Roadmap> {
  constructor() {
    super('roadmaps');
  }

  async findByCategory(categoryId: string): Promise<Roadmap[]> {
    const { data, error } = await this.getTable()
      .select('*')
      .eq('categoryId', categoryId)
      .is('deletedAt', null)
      .eq('isPublished', true);
    
    if (error) {
      throw new Error(`Failed to find roadmaps by category: ${error.message}`);
    }
    
    return data || [];
  }

  async findByInstructor(instructorId: string): Promise<Roadmap[]> {
    const { data, error } = await this.getTable()
      .select('*')
      .eq('instructorId', instructorId)
      .is('deletedAt', null);
    
    if (error) {
      throw new Error(`Failed to find roadmaps by instructor: ${error.message}`);
    }
    
    return data || [];
  }

  async findPublished(limit = 10, offset = 0): Promise<{ data: Roadmap[]; total: number }> {
    const { data, error, count } = await this.getTable()
      .select('*', { count: 'exact' })
      .eq('isPublished', true)
      .is('deletedAt', null)
      .range(offset, offset + limit - 1);
    
    if (error) {
      throw new Error(`Failed to find published roadmaps: ${error.message}`);
    }
    
    return { data: data || [], total: count || 0 };
  }

  async enrollUser(roadmapId: string, userId: string): Promise<boolean> {
    const roadmap = await this.findById(roadmapId);
    if (!roadmap) return false;

    const updatedEnrolledUserIds = [...roadmap.enrolledUserIds, userId];
    return !!(await this.update(roadmapId, { enrolledUserIds: updatedEnrolledUserIds }));
  }

  async unenrollUser(roadmapId: string, userId: string): Promise<boolean> {
    const roadmap = await this.findById(roadmapId);
    if (!roadmap) return false;

    const updatedEnrolledUserIds = roadmap.enrolledUserIds.filter(id => id !== userId);
    return !!(await this.update(roadmapId, { enrolledUserIds: updatedEnrolledUserIds }));
  }
}

export class ChallengeRepository extends BaseRepository<Challenge> {
  constructor() {
    super('challenges');
  }

  async findActiveChallenges(): Promise<Challenge[]> {
    const now = new Date().toISOString();
    const { data, error } = await this.getTable()
      .select('*')
      .eq('status', ChallengeStatus.ACTIVE)
      .lte('startDate', now)
      .gte('endDate', now)
      .is('deletedAt', null);
    
    if (error) {
      throw new Error(`Failed to find active challenges: ${error.message}`);
    }
    
    return data || [];
  }

  async findUpcomingChallenges(): Promise<Challenge[]> {
    const now = new Date().toISOString();
    const { data, error } = await this.getTable()
      .select('*')
      .eq('status', ChallengeStatus.UPCOMING)
      .gt('startDate', now)
      .is('deletedAt', null);
    
    if (error) {
      throw new Error(`Failed to find upcoming challenges: ${error.message}`);
    }
    
    return data || [];
  }

  async findEndedChallenges(): Promise<Challenge[]> {
    const now = new Date().toISOString();
    const { data, error } = await this.getTable()
      .select('*')
      .eq('status', ChallengeStatus.ENDED)
      .lt('endDate', now)
      .is('deletedAt', null);
    
    if (error) {
      throw new Error(`Failed to find ended challenges: ${error.message}`);
    }
    
    return data || [];
  }

  async findAllChallenges(limit = 10, offset = 0): Promise<{ data: Challenge[]; total: number }> {
    const { data, error, count } = await this.getTable()
      .select('*', { count: 'exact' })
      .is('deletedAt', null)
      .range(offset, offset + limit - 1);
    
    if (error) {
      throw new Error(`Failed to find all challenges: ${error.message}`);
    }
    
    return { data: data || [], total: count || 0 };
  }

  async addParticipant(challengeId: string, userId: string): Promise<boolean> {
    const challenge = await this.findById(challengeId);
    if (!challenge) return false;

    const updatedParticipants = [...challenge.participants, userId];
    return !!(await this.update(challengeId, { participants: updatedParticipants }));
  }

  async updateLeaderboard(challengeId: string, entry: LeaderboardEntry): Promise<boolean> {
    const challenge = await this.findById(challengeId);
    if (!challenge) return false;

    const updatedLeaderboard = [...challenge.leaderboard, entry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 100); // Keep top 100

    return !!(await this.update(challengeId, { leaderboard: updatedLeaderboard }));
  }
}

export class LearningProfileRepository extends BaseRepository<LearningProfile> {
  constructor() {
    super('learning_profiles');
  }

  async findByUser(userId: string): Promise<LearningProfile | null> {
    const { data, error } = await this.getTable()
      .select('*')
      .eq('userId', userId)
      .is('deletedAt', null)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to find learning profile: ${error.message}`);
    }
    
    return data || null;
  }
}

export class RecommendationRepository extends BaseRepository<Recommendation> {
  constructor() {
    super('recommendations');
  }

  async findByUser(userId: string): Promise<Recommendation[]> {
    const { data, error } = await this.getTable()
      .select('*')
      .eq('userId', userId)
      .is('deletedAt', null)
      .order('confidenceScore', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to find recommendations by user: ${error.message}`);
    }
    
    return data || [];
  }
}

// Initialize additional repositories
export const examRepo = new ExamRepository();
export const attemptRepo = new ExamAttemptRepository();
export const certificateRepo = new CertificateRepository();
export const roadmapRepo = new RoadmapRepository();
export const challengeRepo = new ChallengeRepository();
export const learningProfileRepo = new LearningProfileRepository();
export const recommendationRepo = new RecommendationRepository();

// Auth Service
export class AuthService {
  constructor(
    private userRepo: UserRepository,
    private refreshTokenRepo: RefreshTokenRepository,
    private cacheService: CacheService,
    private activityLogRepo: ActivityLogRepository
  ) {}

  async register(
    name: string,
    email: string,
    password: string,
    phoneNumber: string,
    role: Role
  ): Promise<{ user: UserDTO; accessToken: string; refreshToken: string }> {
    // Check if user already exists
    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Validate password
    if (!this.validatePassword(password)) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || '12'));

    // Create user
    const user = await this.userRepo.create({
      name,
      email,
      passwordHash,
      phoneNumber,
      dateOfBirth: '', // Will be updated later
      country: '', // Will be updated later
      gender: Gender.OTHER, // Will be updated later
      role,
      profilePictureUrl: null,
      enrolledCourseIds: [],
      isBlocked: false
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Log activity
    await this.activityLogRepo.log(user.id, 'register', 'user', user.id, { role });

    return tokens;
  }

  async login(email: string, password: string): Promise<{ user: UserDTO; accessToken: string; refreshToken: string }> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (user.isBlocked) {
      throw new Error('Account is blocked');
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Log activity
    await this.activityLogRepo.log(user.id, 'login', 'user', user.id);

    return tokens;
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenRecord = await this.refreshTokenRepo.findByToken(refreshToken);
    if (!tokenRecord) {
      throw new Error('Invalid refresh token');
    }

    if (new Date(tokenRecord.expiresAt) < new Date()) {
      await this.refreshTokenRepo.invalidateToken(refreshToken);
      throw new Error('Refresh token expired');
    }

    const user = await this.userRepo.findById(tokenRecord.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Invalidate old refresh token
    await this.refreshTokenRepo.invalidateToken(refreshToken);

    // Generate new tokens
    const tokens = await this.generateTokens(user);

    return tokens;
  }

  async logout(refreshToken: string): Promise<boolean> {
    return this.refreshTokenRepo.invalidateToken(refreshToken);
  }

  private validatePassword(password: string): boolean {
    return password.length >= 8;
  }

  private async generateTokens(user: User): Promise<{ user: UserDTO; accessToken: string; refreshToken: string }> {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h'
    });

    const refreshTokenValue = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    });

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    await this.refreshTokenRepo.create({
      userId: user.id,
      token: refreshTokenValue,
      expiresAt: expiresAt.toISOString()
    });

    const userDTO = new UserDTO(
      user.id,
      user.name,
      user.email,
      user.phoneNumber,
      user.dateOfBirth,
      user.country,
      user.gender,
      user.role,
      user.profilePictureUrl,
      user.isBlocked,
      user.createdAt,
      user.updatedAt,
      user.assignedHrId
    );

    return {
      user: userDTO,
      accessToken,
      refreshToken: refreshTokenValue
    };
  }
}

// User Service
export class UserService {
  constructor(
    private userRepo: UserRepository,
    private enrollmentRepo: EnrollmentRepository,
    private conversationRepo: SupportConversationRepository,
    private cacheService: CacheService,
    private activityLogRepo: ActivityLogRepository,
    private cloudinaryService: typeof CloudinaryService
  ) {}

  async getUserById(id: string): Promise<UserDTO> {
    const cacheKey = `user:${id}`;
    let user = await this.cacheService.get<User>(cacheKey);

    if (!user) {
      user = await this.userRepo.findById(id);
      if (!user) {
        throw new Error('User not found');
      }
      await this.cacheService.set(cacheKey, user, 3600); // Cache for 1 hour
    }

    return new UserDTO(
      user.id,
      user.name,
      user.email,
      user.phoneNumber,
      user.dateOfBirth,
      user.country,
      user.gender,
      user.role,
      user.profilePictureUrl,
      user.isBlocked,
      user.createdAt,
      user.updatedAt,
      user.assignedHrId
    );
  }

  async updateUser(id: string, updateData: Partial<User> & { password?: string }): Promise<UserDTO> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    const updatePayload: Partial<User> = { ...updateData };

    // Handle password update
    if (updateData.password) {
      if (!this.validatePassword(updateData.password)) {
        throw new Error('Password must be at least 8 characters long');
      }
      updatePayload.passwordHash = await bcrypt.hash(updateData.password, parseInt(process.env.BCRYPT_ROUNDS || '12'));
      delete updatePayload.password;
    }

    const updatedUser = await this.userRepo.update(id, updatePayload);
    if (!updatedUser) {
      throw new Error('Failed to update user');
    }

    // Clear cache
    await this.cacheService.del(`user:${id}`);

    // Log activity
    await this.activityLogRepo.log(id, 'update_profile', 'user', id);

    return new UserDTO(
      updatedUser.id,
      updatedUser.name,
      updatedUser.email,
      updatedUser.phoneNumber,
      updatedUser.dateOfBirth,
      updatedUser.country,
      updatedUser.gender,
      updatedUser.role,
      updatedUser.profilePictureUrl,
      updatedUser.isBlocked,
      updatedUser.createdAt,
      updatedUser.updatedAt,
      updatedUser.assignedHrId
    );
  }

  async getUsers(role?: Role, limit = 100, offset = 0): Promise<UserDTO[]> {
    const filters: Record<string, any> = {};
    if (role) {
      filters.role = role;
    }

    const { data: users } = await this.userRepo.findMany(filters, false, limit, offset);

    return users.map(user => new UserDTO(
      user.id,
      user.name,
      user.email,
      user.phoneNumber,
      user.dateOfBirth,
      user.country,
      user.gender,
      user.role,
      user.profilePictureUrl,
      user.isBlocked,
      user.createdAt,
      user.updatedAt,
      user.assignedHrId
    ));
  }

  async blockUser(id: string): Promise<boolean> {
    const result = await this.userRepo.blockUser(id);
    if (result) {
      await this.cacheService.del(`user:${id}`);
      await this.activityLogRepo.log(id, 'block_user', 'user', id);
    }
    return result;
  }

  async unblockUser(id: string): Promise<boolean> {
    const result = await this.userRepo.unblockUser(id);
    if (result) {
      await this.cacheService.del(`user:${id}`);
      await this.activityLogRepo.log(id, 'unblock_user', 'user', id);
    }
    return result;
  }

  async softDeleteUser(id: string): Promise<boolean> {
    const result = await this.userRepo.softDelete(id);
    if (result) {
      await this.cacheService.del(`user:${id}`);
      await this.activityLogRepo.log(id, 'soft_delete_user', 'user', id);
    }
    return result;
  }

  async restoreUser(id: string): Promise<boolean> {
    const result = await this.userRepo.restore(id);
    if (result) {
      await this.cacheService.del(`user:${id}`);
      await this.activityLogRepo.log(id, 'restore_user', 'user', id);
    }
    return result;
  }

  private validatePassword(password: string): boolean {
    return password.length >= 8;
  }
}

// Course Service
export class CourseService {
  constructor(
    private courseRepo: CourseRepository,
    private lessonRepo: LessonRepository,
    private categoryRepo: CategoryRepository,
    private cacheService: CacheService,
    private activityLogRepo: ActivityLogRepository,
    private userRepo: UserRepository,
    private cloudinaryService: typeof CloudinaryService
  ) {}

  async getCoursesPublic(limit = 100, offset = 0): Promise<{ data: CourseDTO[]; total: number }> {
    const cacheKey = `courses:public:${limit}:${offset}`;
    let result = await this.cacheService.get<{ data: CourseDTO[]; total: number }>(cacheKey);

    if (!result) {
      const { data: courses, total } = await this.courseRepo.findMany(
        { isPublished: true },
        false,
        limit,
        offset
      );

      result = {
        data: courses.map(course => this.mapToDTO(course)),
        total
      };

      await this.cacheService.set(cacheKey, result, 1800); // Cache for 30 minutes
    }

    return result;
  }

  async createCourse(data: Omit<Course, keyof BaseEntity>, thumbnailBuffer?: Buffer, introVideoBuffer?: Buffer): Promise<CourseDTO> {
    let thumbnailUrl = '';
    let introVideoUrl = '';

    // Upload thumbnail if provided
    if (thumbnailBuffer) {
      thumbnailUrl = await this.cloudinaryService.uploadImage(thumbnailBuffer, 'courses/thumbnails');
    }

    // Upload intro video if provided
    if (introVideoBuffer) {
      introVideoUrl = await this.cloudinaryService.uploadVideo(introVideoBuffer, 'courses/intro-videos');
    }

    const course = await this.courseRepo.create({
      ...data,
      thumbnailUrl,
      introVideoUrl: introVideoUrl || undefined,
      totalLessons: 0,
      studentIds: [],
      firstPublishDate: null,
      enrollmentCount: 0,
      rating: 0,
      isPublished: false
    });

    // Log activity
    await this.activityLogRepo.log(data.instructorId, 'create_course', 'course', course.id);

    return this.mapToDTO(course);
  }

  async getCourseById(id: string): Promise<CourseDTO> {
    const cacheKey = `course:${id}`;
    let course = await this.cacheService.get<Course>(cacheKey);

    if (!course) {
      course = await this.courseRepo.findById(id);
      if (!course) {
        throw new Error('Course not found');
      }
      await this.cacheService.set(cacheKey, course, 3600); // Cache for 1 hour
    }

    return this.mapToDTO(course);
  }

  async updateCourse(id: string, data: Partial<Course>, thumbnailBuffer?: Buffer, introVideoBuffer?: Buffer): Promise<CourseDTO> {
    const course = await this.courseRepo.findById(id);
    if (!course) {
      throw new Error('Course not found');
    }

    const updateData: Partial<Course> = { ...data };

    // Handle thumbnail update
    if (thumbnailBuffer) {
      // Delete old thumbnail if exists
      if (course.thumbnailUrl) {
        await this.cloudinaryService.deleteFile(course.thumbnailUrl);
      }
      updateData.thumbnailUrl = await this.cloudinaryService.uploadImage(thumbnailBuffer, 'courses/thumbnails');
    }

    // Handle intro video update
    if (introVideoBuffer) {
      // Delete old intro video if exists
      if (course.introVideoUrl) {
        await this.cloudinaryService.deleteFile(course.introVideoUrl);
      }
      updateData.introVideoUrl = await this.cloudinaryService.uploadVideo(introVideoBuffer, 'courses/intro-videos');
    }

    const updatedCourse = await this.courseRepo.update(id, updateData);
    if (!updatedCourse) {
      throw new Error('Failed to update course');
    }

    // Clear cache
    await this.cacheService.del(`course:${id}`);
    await this.cacheService.delByPrefix('courses:public:');

    // Log activity
    await this.activityLogRepo.log(course.instructorId, 'update_course', 'course', id);

    return this.mapToDTO(updatedCourse);
  }

  async softDeleteCourse(id: string): Promise<boolean> {
    const course = await this.courseRepo.findById(id);
    if (!course) {
      throw new Error('Course not found');
    }

    const result = await this.courseRepo.softDelete(id);
    if (result) {
      await this.cacheService.del(`course:${id}`);
      await this.cacheService.delByPrefix('courses:public:');
      await this.activityLogRepo.log(course.instructorId, 'soft_delete_course', 'course', id);
    }
    return result;
  }

  async restoreCourse(id: string): Promise<boolean> {
    const result = await this.courseRepo.restore(id);
    if (result) {
      await this.cacheService.delByPrefix('courses:public:');
      await this.activityLogRepo.log('system', 'restore_course', 'course', id);
    }
    return result;
  }

  async getTopCourses(limit = 5): Promise<CourseDTO[]> {
    const cacheKey = `courses:top:${limit}`;
    let courses = await this.cacheService.get<Course[]>(cacheKey);

    if (!courses) {
      courses = await this.courseRepo.getTopCourses(limit);
      await this.cacheService.set(cacheKey, courses, 1800); // Cache for 30 minutes
    }

    return courses.map(course => this.mapToDTO(course));
  }

  private mapToDTO(course: Course): CourseDTO {
    return new CourseDTO(
      course.id,
      course.title,
      course.description,
      course.thumbnailUrl,
      course.introVideoUrl,
      course.instructorId,
      course.totalLessons,
      course.categoryId,
      course.language,
      course.level,
      course.tags,
      course.studentIds,
      course.firstPublishDate,
      course.price,
      course.duration,
      course.rating,
      course.enrollmentCount,
      course.isPublished,
      course.createdAt,
      course.updatedAt
    );
  }
}

// Lesson Service
export class LessonService {
  constructor(
    private lessonRepo: LessonRepository,
    private courseRepo: CourseRepository,
    private cacheService: CacheService,
    private activityLogRepo: ActivityLogRepository,
    private userRepo: UserRepository
  ) {}

  async createLesson(data: Omit<Lesson, keyof BaseEntity | 'lessonNumber'>, videoBuffer?: Buffer, thumbnailBuffer?: Buffer): Promise<LessonDTO> {
    let videoUrl = '';
    let thumbnailUrl = '';

    // Upload video if provided
    if (videoBuffer) {
      videoUrl = await CloudinaryService.uploadVideo(videoBuffer, 'lessons/videos');
      
      // Generate thumbnail from video
      if (thumbnailBuffer) {
        thumbnailUrl = await CloudinaryService.uploadImage(thumbnailBuffer, 'lessons/thumbnails');
      } else {
        // Generate thumbnail from video
        thumbnailUrl = await CloudinaryService.generateVideoThumbnail(videoUrl);
      }
    }

    const lesson = await this.lessonRepo.createWithNumber({
      ...data,
      videoUrl,
      thumbnailUrl,
      attachments: []
    });

    // Update course total lessons count
    await this.courseRepo.incrementTotalLessons(data.courseId);

    // Log activity
    await this.activityLogRepo.log(data.instructorId, 'create_lesson', 'lesson', lesson.id);

    return this.mapToDTO(lesson);
  }

  async getLessonById(id: string): Promise<LessonDTO> {
    const cacheKey = `lesson:${id}`;
    let lesson = await this.cacheService.get<Lesson>(cacheKey);

    if (!lesson) {
      lesson = await this.lessonRepo.findById(id);
      if (!lesson) {
        throw new Error('Lesson not found');
      }
      await this.cacheService.set(cacheKey, lesson, 3600); // Cache for 1 hour
    }

    return this.mapToDTO(lesson);
  }

  async updateLesson(id: string, data: Partial<Lesson>, videoBuffer?: Buffer, thumbnailBuffer?: Buffer): Promise<LessonDTO> {
    const lesson = await this.lessonRepo.findById(id);
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    const updateData: Partial<Lesson> = { ...data };

    // Handle video update
    if (videoBuffer) {
      // Delete old video if exists
      if (lesson.videoUrl) {
        await CloudinaryService.deleteFile(lesson.videoUrl);
      }
      updateData.videoUrl = await CloudinaryService.uploadVideo(videoBuffer, 'lessons/videos');
    }

    // Handle thumbnail update
    if (thumbnailBuffer) {
      // Delete old thumbnail if exists
      if (lesson.thumbnailUrl) {
        await CloudinaryService.deleteFile(lesson.thumbnailUrl);
      }
      updateData.thumbnailUrl = await CloudinaryService.uploadImage(thumbnailBuffer, 'lessons/thumbnails');
    }

    const updatedLesson = await this.lessonRepo.update(id, updateData);
    if (!updatedLesson) {
      throw new Error('Failed to update lesson');
    }

    // Clear cache
    await this.cacheService.del(`lesson:${id}`);

    // Log activity
    await this.activityLogRepo.log(lesson.instructorId, 'update_lesson', 'lesson', id);

    return this.mapToDTO(updatedLesson);
  }

  async softDeleteLesson(id: string): Promise<boolean> {
    const lesson = await this.lessonRepo.findById(id);
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    const result = await this.lessonRepo.softDelete(id);
    if (result) {
      await this.courseRepo.decrementTotalLessons(lesson.courseId);
      await this.cacheService.del(`lesson:${id}`);
      await this.activityLogRepo.log(lesson.instructorId, 'soft_delete_lesson', 'lesson', id);
    }
    return result;
  }

  async restoreLesson(id: string): Promise<boolean> {
    const lesson = await this.lessonRepo.findById(id, true); // Include deleted
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    const result = await this.lessonRepo.restore(id);
    if (result) {
      await this.courseRepo.incrementTotalLessons(lesson.courseId);
      await this.activityLogRepo.log(lesson.instructorId, 'restore_lesson', 'lesson', id);
    }
    return result;
  }

  async permanentDeleteLesson(id: string): Promise<boolean> {
    const lesson = await this.lessonRepo.findById(id, true); // Include deleted
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    // Delete files from Cloudinary
    if (lesson.videoUrl) {
      await CloudinaryService.deleteFile(lesson.videoUrl);
    }
    if (lesson.thumbnailUrl) {
      await CloudinaryService.deleteFile(lesson.thumbnailUrl);
    }

    const result = await this.lessonRepo.permanentDelete(id);
    if (result) {
      await this.courseRepo.decrementTotalLessons(lesson.courseId);
      await this.activityLogRepo.log(lesson.instructorId, 'permanent_delete_lesson', 'lesson', id);
    }
    return result;
  }

  async getLessonsByCourse(courseId: string, limit = 10, offset = 0): Promise<{ data: LessonDTO[]; total: number }> {
    const cacheKey = `lessons:course:${courseId}:${limit}:${offset}`;
    let result = await this.cacheService.get<{ data: LessonDTO[]; total: number }>(cacheKey);

    if (!result) {
      const lessons = await this.lessonRepo.findByCourse(courseId);
      const paginatedLessons = lessons.slice(offset, offset + limit);

      result = {
        data: paginatedLessons.map(lesson => this.mapToDTO(lesson)),
        total: lessons.length
      };

      await this.cacheService.set(cacheKey, result, 1800); // Cache for 30 minutes
    }

    return result;
  }

  private mapToDTO(lesson: Lesson): LessonDTO {
    return new LessonDTO(
      lesson.id,
      lesson.courseId,
      lesson.lessonNumber,
      lesson.title,
      lesson.description,
      lesson.videoUrl,
      lesson.thumbnailUrl,
      lesson.attachments,
      lesson.instructorId,
      lesson.durationMinutes,
      lesson.createdAt,
      lesson.updatedAt
    );
  }
}

// Initialize services
export const authService = new AuthService(userRepo, refreshTokenRepo, cacheService, activityLogRepo);
export const userService = new UserService(userRepo, enrollmentRepo, conversationRepo, cacheService, activityLogRepo, CloudinaryService);
export const courseService = new CourseService(courseRepo, lessonRepo, categoryRepo, cacheService, activityLogRepo, userRepo, CloudinaryService);
export const lessonService = new LessonService(lessonRepo, courseRepo, cacheService, activityLogRepo, userRepo);

export default {
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
  recommendationRepo
};
