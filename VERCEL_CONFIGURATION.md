# Vercel Serverless Configuration for Sinceides Platform

## 📋 Overview

This document provides comprehensive configuration for deploying the Sinceides Platform on Vercel serverless functions with optimal performance and security.

## 🔧 Vercel Configuration Files

> **Important**: 
> - The `functions` property cannot be used with `builds` property
> - The `routes` property cannot be used with `rewrites`, `headers`, `redirects`, `cleanUrls`, or `trailingSlash`
> - All function configuration is defined within `builds.config`
> - All routing is handled by `rewrites` instead of `routes`

### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.ts",
      "use": "@vercel/node",
      "config": {
        "includeFiles": [
          "api/**/*",
          "global.d.ts"
        ],
        "maxDuration": 30,
        "memory": 1024,
        "runtime": "nodejs18.x"
      }
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "regions": ["iad1"],
  "framework": null,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.ts"
    },
    {
      "source": "/docs",
      "destination": "/api/index.ts"
    },
    {
      "source": "/health",
      "destination": "/api/index.ts"
    },
    {
      "source": "/(.*)",
      "destination": "/api/index.ts"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization, X-Requested-With, X-Request-ID"
        },
        {
          "key": "Access-Control-Max-Age",
          "value": "86400"
        }
      ]
    }
  ],
  "crons": []
}
```

## 🔄 Routing Configuration

### Routes vs Rewrites
- **Routes**: Used for simple routing with methods specification
- **Rewrites**: Used for URL rewriting without changing the browser URL
- **Conflict**: Cannot use both `routes` and `rewrites`/`headers` together

### Current Configuration
We use `rewrites` to handle all routing:
- `/api/*` → `/api/index.ts`
- `/docs` → `/api/index.ts`
- `/health` → `/api/index.ts`
- `/*` → `/api/index.ts` (catch-all)

## 🚀 Deployment Configuration

### Environment Variables Setup

#### Required Environment Variables
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Redis Configuration (Upstash)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_64_chars_minimum
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_64_chars_minimum
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.com

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

### Vercel CLI Commands

#### Install Vercel CLI
```bash
npm i -g vercel
```

#### Login to Vercel
```bash
vercel login
```

#### Deploy to Production
```bash
vercel --prod
```

#### Deploy Preview
```bash
vercel
```

#### Set Environment Variables
```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add CLOUDINARY_CLOUD_NAME
vercel env add CLOUDINARY_API_KEY
vercel env add CLOUDINARY_API_SECRET
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN
vercel env add JWT_SECRET
vercel env add JWT_REFRESH_SECRET
vercel env add CORS_ORIGIN
```

## ⚡ Performance Optimizations

### Function Configuration
- **Runtime**: Node.js 18.x
- **Memory**: 1024MB (1GB)
- **Max Duration**: 30 seconds
- **Region**: US East (iad1)
- **Configuration**: Defined in `builds.config` (not `functions` property)

### Cold Start Optimization
```javascript
// In api/index.ts - Optimize imports
import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';

// Initialize clients outside handler
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
```

### Connection Pooling
```javascript
// Use connection pooling for database
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: false,
    },
    global: {
      headers: {
        'x-application-name': 'sinceides-platform',
      },
    },
  }
);
```

## 🔒 Security Configuration

### CORS Headers
```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://your-frontend-domain.com"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization, X-Requested-With, X-Request-ID"
        },
        {
          "key": "Access-Control-Max-Age",
          "value": "86400"
        }
      ]
    }
  ]
}
```

### Security Headers
```javascript
// Add to api/api.js
app.use(helmet({
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
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

## 📊 Monitoring & Analytics

### Vercel Analytics
```bash
# Install Vercel Analytics
npm install @vercel/analytics
```

### Custom Monitoring
```javascript
// Add to api/api.js
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
});
```

## 🚨 Error Handling

### Global Error Handler
```javascript
// Add to api/api.js
app.use((error, req, res, next) => {
  console.error('Error:', error);
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(error.status || 500).json({
    error: 'Internal Server Error',
    message: isDevelopment ? error.message : 'Something went wrong',
    ...(isDevelopment && { stack: error.stack })
  });
});
```

### Function Timeout Handling
```javascript
// Add timeout handling
const timeout = (ms) => new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Function timeout')), ms)
);

export default async function handler(req, res) {
  try {
    await Promise.race([
      app(req, res),
      timeout(25000) // 25 seconds timeout
    ]);
  } catch (error) {
    if (error.message === 'Function timeout') {
      res.status(504).json({ error: 'Request timeout' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
```

## 🔄 CI/CD Pipeline

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 📈 Performance Monitoring

### Metrics to Track
- **Cold Start Time**: < 1 second
- **Function Duration**: < 5 seconds average
- **Memory Usage**: < 80% of allocated
- **Error Rate**: < 1%
- **Response Time**: < 200ms (95th percentile)

### Vercel Dashboard
- Monitor function performance
- Track error rates
- Analyze usage patterns
- Set up alerts

## 🛠️ Development Workflow

### Local Development
```bash
# Install Vercel CLI
npm i -g vercel

# Start local development
vercel dev

# Deploy preview
vercel

# Deploy to production
vercel --prod
```

### Environment Management
```bash
# List environments
vercel env ls

# Add environment variable
vercel env add VARIABLE_NAME

# Remove environment variable
vercel env rm VARIABLE_NAME

# Pull environment variables
vercel env pull .env.local
```

## 🔧 Troubleshooting

### Common Issues

#### Cold Start Performance
- Use connection pooling
- Initialize clients outside handlers
- Minimize dependencies
- Use edge functions for simple operations

#### Memory Issues
- Increase memory allocation
- Optimize image processing
- Use streaming for large files
- Implement proper cleanup

#### Timeout Issues
- Increase max duration
- Optimize database queries
- Use background processing
- Implement proper error handling

#### CORS Issues
- Configure proper origins
- Handle preflight requests
- Use proper headers
- Test with different browsers

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Serverless Functions Guide](https://vercel.com/docs/concepts/functions)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Performance Optimization](https://vercel.com/docs/concepts/functions/serverless-functions#performance)
- [Security Best Practices](https://vercel.com/docs/concepts/functions/serverless-functions#security)

---

**Configuration Updated**: 2024-01-01  
**Vercel Version**: 2.0  
**Node.js Version**: 18.x
