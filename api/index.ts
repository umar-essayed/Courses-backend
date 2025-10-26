/**
 * Sinceides Platform - Main API Handler
 * This file imports and exports the main API application
 * Updated to use modular architecture with Supabase and Cloudinary
 * Optimized for Vercel serverless functions
 */

// Import the main API application
import app from './api.js';

// Vercel serverless function handler
export default async function handler(req: any, res: any) {
  // Add Vercel-specific headers
  res.setHeader('x-vercel-region', process.env['VERCEL_REGION'] || 'unknown');
  res.setHeader('x-vercel-deployment-url', process.env['VERCEL_URL'] || 'unknown');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Request-ID');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }
  
  // Add request ID for tracking
  req.requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Set request ID header
  res.setHeader('x-request-id', req.requestId);
  
  // Handle the request
  return app(req, res);
}