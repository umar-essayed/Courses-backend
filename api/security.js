/**
 * Sinceides Platform - Advanced Security Configuration
 * This file contains enhanced security measures and configurations
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

// Security Configuration
export class SecurityConfig {
  // JWT Configuration
  static readonly JWT_SECRET = process.env.JWT_SECRET || this.generateSecureSecret();
  static readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || this.generateSecureSecret();
  static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
  static readonly JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  // Password Configuration
  static readonly BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');
  static readonly MIN_PASSWORD_LENGTH = 8;
  static readonly MAX_PASSWORD_LENGTH = 128;

  // Rate Limiting Configuration
  static readonly RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 minutes
  static readonly RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');
  static readonly RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS = false;
  static readonly RATE_LIMIT_SKIP_FAILED_REQUESTS = false;

  // File Upload Security
  static readonly MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE?.replace('MB', '') || '50') * 1024 * 1024;
  static readonly ALLOWED_IMAGE_TYPES = (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/webp,image/gif').split(',');
  static readonly ALLOWED_VIDEO_TYPES = (process.env.ALLOWED_VIDEO_TYPES || 'video/mp4,video/webm,video/avi,video/mov').split(',');
  static readonly ALLOWED_DOCUMENT_TYPES = (process.env.ALLOWED_DOCUMENT_TYPES || 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document').split(',');

  // CORS Configuration
  static readonly CORS_ORIGINS = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',');
  static readonly CORS_CREDENTIALS = true;
  static readonly CORS_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];

  // Security Headers Configuration
  static readonly HELMET_CONFIG = {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "http:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "https://api.cloudinary.com", "https://*.supabase.co"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  };

  // Session Configuration
  static readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  static readonly MAX_CONCURRENT_SESSIONS = 5;

  // Account Security
  static readonly MAX_LOGIN_ATTEMPTS = 5;
  static readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  static readonly PASSWORD_RESET_EXPIRES_IN = '1h';

  // Generate secure random secret
  private static generateSecureSecret(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  // Validate password strength
  static validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < this.MIN_PASSWORD_LENGTH) {
      errors.push(`Password must be at least ${this.MIN_PASSWORD_LENGTH} characters long`);
    }

    if (password.length > this.MAX_PASSWORD_LENGTH) {
      errors.push(`Password must be no more than ${this.MAX_PASSWORD_LENGTH} characters long`);
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check for common passwords
    const commonPasswords = [
      'password', '123456', 'password123', 'admin', 'qwerty',
      'letmein', 'welcome', 'monkey', '1234567890', 'abc123'
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common, please choose a more unique password');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Hash password with salt
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.BCRYPT_ROUNDS);
  }

  // Verify password
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Generate JWT token
  static generateToken(payload: any, expiresIn?: string): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: expiresIn || this.JWT_EXPIRES_IN,
      issuer: 'sinceides-platform',
      audience: 'sinceides-users'
    });
  }

  // Generate refresh token
  static generateRefreshToken(payload: any): string {
    return jwt.sign(payload, this.JWT_REFRESH_SECRET, {
      expiresIn: this.JWT_REFRESH_EXPIRES_IN,
      issuer: 'sinceides-platform',
      audience: 'sinceides-users'
    });
  }

  // Verify JWT token
  static verifyToken(token: string): any {
    return jwt.verify(token, this.JWT_SECRET, {
      issuer: 'sinceides-platform',
      audience: 'sinceides-users'
    });
  }

  // Verify refresh token
  static verifyRefreshToken(token: string): any {
    return jwt.verify(token, this.JWT_REFRESH_SECRET, {
      issuer: 'sinceides-platform',
      audience: 'sinceides-users'
    });
  }

  // Generate secure random string
  static generateSecureRandom(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // Generate verification code
  static generateVerificationCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  // Sanitize input
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/['"]/g, '') // Remove quotes
      .replace(/[;]/g, '') // Remove semicolons
      .trim();
  }

  // Validate file type
  static validateFileType(mimetype: string, allowedTypes: string[]): boolean {
    return allowedTypes.includes(mimetype);
  }

  // Validate file size
  static validateFileSize(size: number): boolean {
    return size <= this.MAX_FILE_SIZE;
  }

  // Generate file hash for integrity checking
  static generateFileHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  // Check for suspicious patterns
  static detectSuspiciousActivity(userAgent: string, ip: string): boolean {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  // Rate limiting configuration
  static getRateLimitConfig() {
    return rateLimit({
      windowMs: this.RATE_LIMIT_WINDOW_MS,
      max: this.RATE_LIMIT_MAX_REQUESTS,
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(this.RATE_LIMIT_WINDOW_MS / 1000 / 60) + ' minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/api/health';
      },
      keyGenerator: (req) => {
        // Use user ID if authenticated, otherwise IP
        return req.user?.id || req.ip;
      }
    });
  }

  // CORS configuration
  static getCorsConfig() {
    return cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, etc.)
        if (!origin) return callback(null, true);
        
        if (this.CORS_ORIGINS.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: this.CORS_CREDENTIALS,
      methods: this.CORS_METHODS,
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-Request-ID',
        'Accept',
        'Origin'
      ],
      exposedHeaders: [
        'X-Request-ID',
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset'
      ]
    });
  }

  // Helmet configuration
  static getHelmetConfig() {
    return helmet(this.HELMET_CONFIG);
  }

  // Security middleware
  static getSecurityMiddleware() {
    return [
      this.getHelmetConfig(),
      this.getCorsConfig(),
      this.getRateLimitConfig()
    ];
  }

  // Log security events
  static logSecurityEvent(event: string, details: any, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      severity,
      details: this.sanitizeLogData(details),
      source: 'security-module'
    };

    console.log(`[SECURITY-${severity.toUpperCase()}]`, JSON.stringify(logEntry));
  }

  // Sanitize log data
  private static sanitizeLogData(data: any): any {
    const sanitized = { ...data };
    
    // Remove sensitive fields
    const sensitiveFields = [
      'password',
      'passwordHash',
      'refreshToken',
      'accessToken',
      'secret',
      'key',
      'token'
    ];

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  // Check for brute force attempts
  static async checkBruteForceAttempts(identifier: string, maxAttempts: number = this.MAX_LOGIN_ATTEMPTS): Promise<boolean> {
    // This would typically check against a cache or database
    // For now, we'll implement a simple in-memory check
    const attempts = this.getAttemptCount(identifier);
    return attempts >= maxAttempts;
  }

  // Record failed attempt
  static async recordFailedAttempt(identifier: string): Promise<void> {
    this.incrementAttemptCount(identifier);
  }

  // Clear failed attempts
  static async clearFailedAttempts(identifier: string): Promise<void> {
    this.resetAttemptCount(identifier);
  }

  // Simple in-memory attempt tracking (in production, use Redis)
  private static attemptCounts: Map<string, { count: number; timestamp: number }> = new Map();

  private static getAttemptCount(identifier: string): number {
    const record = this.attemptCounts.get(identifier);
    if (!record) return 0;

    // Reset if lockout period has passed
    if (Date.now() - record.timestamp > this.LOCKOUT_DURATION) {
      this.attemptCounts.delete(identifier);
      return 0;
    }

    return record.count;
  }

  private static incrementAttemptCount(identifier: string): void {
    const current = this.getAttemptCount(identifier);
    this.attemptCounts.set(identifier, {
      count: current + 1,
      timestamp: Date.now()
    });
  }

  private static resetAttemptCount(identifier: string): void {
    this.attemptCounts.delete(identifier);
  }

  // Validate email format
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate phone number format
  static validatePhoneNumber(phoneNumber: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  // Generate secure filename
  static generateSecureFilename(originalName: string): string {
    const timestamp = Date.now();
    const random = this.generateSecureRandom(8);
    const extension = originalName.split('.').pop() || '';
    return `${timestamp}_${random}.${extension}`;
  }

  // Check for malicious file content
  static async scanFileContent(buffer: Buffer): Promise<{ safe: boolean; threats: string[] }> {
    const threats: string[] = [];
    
    // Check for common malicious patterns
    const maliciousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i,
      /eval\(/i,
      /document\.cookie/i,
      /window\.location/i
    ];

    const content = buffer.toString('utf8', 0, Math.min(buffer.length, 1024));
    
    maliciousPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        threats.push(`Malicious pattern detected: ${pattern.source}`);
      }
    });

    return {
      safe: threats.length === 0,
      threats
    };
  }

  // Encrypt sensitive data
  static encryptData(data: string, key?: string): string {
    const encryptionKey = key || this.JWT_SECRET;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', encryptionKey);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  // Decrypt sensitive data
  static decryptData(encryptedData: string, key?: string): string {
    const encryptionKey = key || this.JWT_SECRET;
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipher('aes-256-cbc', encryptionKey);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

module.exports = SecurityConfig;
