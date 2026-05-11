// server/src/config/env.js
import { cleanEnv, str, port, url, num, bool, email } from 'envalid';

/**
 * Environment variables validation schema
 * Validates all required env vars on startup
 */
export const env = cleanEnv(process.env, {
  // ==================== SERVER ====================
  NODE_ENV: str({
    choices: ['development', 'staging', 'production'],
    default: 'development',
    desc: 'Node environment'
  }),
  
  PORT: port({
    default: 5000,
    desc: 'Server port number'
  }),
  
  API_VERSION: str({
    default: 'v1',
    desc: 'API version prefix'
  }),

  // ==================== DATABASE ====================
  DATABASE_URL: url({
    desc: 'PostgreSQL connection string',
    example: 'postgresql://user:pass@localhost:5432/urbannest'
  }),
  
  DATABASE_POOL_SIZE: num({
    default: 10,
    desc: 'Database connection pool size'
  }),
  
  DATABASE_TIMEOUT: num({
    default: 30000,
    desc: 'Database query timeout (ms)'
  }),

  // ==================== JWT SECURITY ====================
  JWT_SECRET: str({
    minLength: 32,
    desc: 'JWT signing secret (min 32 chars)',
    example: 'your-super-secret-key-min-32-chars-long!!!'
  }),
  
  JWT_REFRESH_SECRET: str({
    minLength: 32,
    default: undefined,
    desc: 'JWT refresh token secret (optional, defaults to JWT_SECRET)'
  }),
  
  JWT_ACCESS_EXPIRES_IN: str({
    default: '15m',
    desc: 'Access token expiration (e.g., 15m, 1h, 7d)'
  }),
  
  JWT_REFRESH_EXPIRES_IN: str({
    default: '7d',
    desc: 'Refresh token expiration'
  }),

  // ==================== CORS & SECURITY ====================
  FRONTEND_URL: url({
    default: 'http://localhost:3000',
    desc: 'Frontend application URL'
  }),
  
  ALLOWED_ORIGINS: str({
    default: '',
    desc: 'Comma-separated list of allowed CORS origins'
  }),
  
  RATE_LIMIT_WINDOW_MS: num({
    default: 900000,
    desc: 'Rate limit window in milliseconds'
  }),
  
  RATE_LIMIT_MAX_REQUESTS: num({
    default: 100,
    desc: 'Maximum requests per window'
  }),

  // ==================== FILE UPLOADS ====================
  MAX_FILE_SIZE_MB: num({
    default: 10,
    desc: 'Maximum file upload size in MB'
  }),
  
  ALLOWED_IMAGE_TYPES: str({
    default: 'image/jpeg,image/png,image/webp',
    desc: 'Comma-separated allowed MIME types'
  }),
  
  UPLOAD_PATH: str({
    default: './uploads',
    desc: 'File upload directory path'
  }),

  // ==================== CLOUD STORAGE (Optional) ====================
  CLOUDINARY_CLOUD_NAME: str({
    default: '',
    desc: 'Cloudinary cloud name (optional)'
  }),
  
  CLOUDINARY_API_KEY: str({
    default: '',
    desc: 'Cloudinary API key (optional)'
  }),
  
  CLOUDINARY_API_SECRET: str({
    default: '',
    desc: 'Cloudinary API secret (optional)'
  }),

  // ==================== PAYMENT GATEWAYS ====================
  STRIPE_SECRET_KEY: str({
    default: '',
    desc: 'Stripe secret key (optional for development)'
  }),
  
  STRIPE_WEBHOOK_SECRET: str({
    default: '',
    desc: 'Stripe webhook secret'
  }),
  
  CHAPA_SECRET_KEY: str({
    default: '',
    desc: 'Chapa payment secret key (Ethiopia)'
  }),

  // ==================== EMAIL ====================
  SMTP_HOST: str({
    default: '',
    desc: 'SMTP server hostname'
  }),
  
  SMTP_PORT: port({
    default: 587,
    desc: 'SMTP server port'
  }),
  
  SMTP_USER: str({
    default: '',
    desc: 'SMTP authentication username'
  }),
  
  SMTP_PASS: str({
    default: '',
    desc: 'SMTP authentication password'
  }),
  
  EMAIL_FROM: email({
    default: 'noreply@urbannest.com',
    desc: 'Default from email address'
  }),

  // ==================== REDIS (Optional) ====================
  REDIS_URL: url({
    default: 'redis://localhost:6379',
    desc: 'Redis connection URL'
  }),
  
  REDIS_PASSWORD: str({
    default: '',
    desc: 'Redis password (optional)'
  }),

  // ==================== LOGGING ====================
  LOG_LEVEL: str({
    choices: ['error', 'warn', 'info', 'http', 'debug'],
    default: 'info',
    desc: 'Logging level'
  }),
  
  LOG_TO_FILE: bool({
    default: false,
    desc: 'Whether to log to files'
  }),

  // ==================== MAINTENANCE ====================
  MAINTENANCE_MODE: bool({
    default: false,
    desc: 'Enable maintenance mode'
  }),
  
  MAINTENANCE_MESSAGE: str({
    default: 'Under maintenance. Please check back later.',
    desc: 'Maintenance mode message'
  })
});

// ==================== Validation Helpers ====================

/**
 * Check if required services are configured
 */
export const isEmailConfigured = () => {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
};

export const isStripeConfigured = () => {
  return Boolean(env.STRIPE_SECRET_KEY);
};

export const isCloudinaryConfigured = () => {
  return Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY);
};

/**
 * Get allowed origins as array
 */
export const getAllowedOrigins = () => {
  const origins = [env.FRONTEND_URL];
  if (env.ALLOWED_ORIGINS) {
    origins.push(...env.ALLOWED_ORIGINS.split(','));
  }
  if (env.NODE_ENV === 'development') {
    origins.push('http://localhost:3000', 'http://localhost:3001');
  }
  return [...new Set(origins)];
};

/**
 * Get allowed MIME types as array
 */
export const getAllowedMimeTypes = () => {
  return env.ALLOWED_IMAGE_TYPES.split(',');
};

/**
 * Validate JWT secret strength
 */
export const validateJwtSecret = () => {
  if (env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
  if (env.JWT_SECRET === 'your-secret-key' || env.JWT_SECRET.includes('default')) {
    throw new Error('JWT_SECRET is using default/insecure value');
  }
  return true;
};

// ==================== Production Startup Check ====================

/**
 * Run critical validation checks before starting server
 */
export const validateProductionConfig = () => {
  if (env.NODE_ENV === 'production') {
    const criticalChecks = [
      { condition: env.JWT_SECRET.length >= 32, message: 'JWT_SECRET must be at least 32 characters' },
      { condition: env.JWT_SECRET !== 'your-secret-key', message: 'JWT_SECRET cannot use default value' },
      { condition: env.DATABASE_URL.startsWith('postgresql'), message: 'DATABASE_URL must be PostgreSQL' },
      { condition: env.FRONTEND_URL.startsWith('https'), message: 'FRONTEND_URL must use HTTPS in production' }
    ];
    
    const failures = criticalChecks.filter(check => !check.condition);
    if (failures.length > 0) {
      console.error('❌ Production configuration validation failed:');
      failures.forEach(failure => console.error(`   - ${failure.message}`));
      process.exit(1);
    }
  }
};

// Export individual env vars for convenience
export const {
  NODE_ENV,
  PORT,
  API_VERSION,
  DATABASE_URL,
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
  FRONTEND_URL,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
  MAX_FILE_SIZE_MB,
  UPLOAD_PATH,
  MAINTENANCE_MODE,
  MAINTENANCE_MESSAGE
} = env;