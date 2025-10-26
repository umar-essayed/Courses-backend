/**
 * Sinceides Platform - Global Type Definitions
 * This file contains global type definitions for the platform
 */

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
      requestId?: string;
      file?: Multer.File;
      files?: Multer.File[];
    }
  }

  namespace NodeJS {
    interface ProcessEnv {
      // Supabase Configuration
      SUPABASE_URL: string;
      SUPABASE_ANON_KEY: string;
      SUPABASE_SERVICE_ROLE_KEY: string;

      // Cloudinary Configuration
      CLOUDINARY_CLOUD_NAME: string;
      CLOUDINARY_API_KEY: string;
      CLOUDINARY_API_SECRET: string;

      // Redis Configuration
      UPSTASH_REDIS_REST_URL: string;
      UPSTASH_REDIS_REST_TOKEN: string;

      // JWT Configuration
      JWT_SECRET: string;
      JWT_REFRESH_SECRET: string;
      JWT_EXPIRES_IN: string;
      JWT_REFRESH_EXPIRES_IN: string;

      // Server Configuration
      PORT: string;
      NODE_ENV: 'development' | 'production' | 'test';
      CORS_ORIGIN: string;

      // File Upload Configuration
      MAX_FILE_SIZE: string;
      ALLOWED_IMAGE_TYPES: string;
      ALLOWED_VIDEO_TYPES: string;
      ALLOWED_DOCUMENT_TYPES: string;

      // Video Processing Configuration
      VIDEO_QUALITIES: string;
      VIDEO_COMPRESSION_QUALITY: string;
      THUMBNAIL_GENERATION: string;

      // Rate Limiting
      RATE_LIMIT_WINDOW_MS: string;
      RATE_LIMIT_MAX_REQUESTS: string;

      // Security
      BCRYPT_ROUNDS: string;

      // Logging
      LOG_LEVEL: string;
      LOG_FILE_PATH: string;
    }
  }
}

// Module declarations
declare module "bcryptjs";
declare module "passport";
declare module "passport-local";
declare module "passport-jwt";
declare module "multer";
declare module "cors";
declare module "compression";
declare module "morgan";
declare module "uuid";
declare module "swagger-ui-express";
declare module "swagger-jsdoc";
declare module "pdfkit";
declare module "sharp";
declare module "cloudinary";

export {};