import { cleanEnv, str, port, url, bool, num } from 'envalid';

export default cleanEnv(process.env, {
  NODE_ENV: str({ choices: ['development', 'staging', 'production'], default: 'development' }),
  PORT: port({ default: 5000 }),
  DATABASE_URL: url(),
  JWT_SECRET: str({ minLength: 32 }),
  JWT_EXPIRES_IN: str({ default: '7d' }),
  JWT_REFRESH_SECRET: str({ minLength: 32 }),
  CLIENT_URL: url({ default: 'http://localhost:3000' }),
  RATE_LIMIT_WINDOW_MS: num({ default: 900000 }),
  RATE_LIMIT_MAX_REQUESTS: num({ default: 100 }),
  UPLOAD_MAX_SIZE: num({ default: 10485760 }), // 10MB
  ALLOWED_FILE_TYPES: str({ default: 'image/jpeg,image/png,image/webp' }),
  CLOUDINARY_CLOUD_NAME: str({ default: '' }),
  CLOUDINARY_API_KEY: str({ default: '' }),
  CLOUDINARY_API_SECRET: str({ default: '' }),
  STRIPE_SECRET_KEY: str({ default: '' }),
  SMTP_HOST: str({ default: '' }),
  SMTP_PORT: port({ default: 587 }),
  SMTP_USER: str({ default: '' }),
  SMTP_PASS: str({ default: '' }),
  REDIS_URL: url({ default: 'redis://localhost:6379' }),
  ENABLE_CSRF: bool({ default: true })
});