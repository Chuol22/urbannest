// Run this before starting your server
import { env, validateProductionConfig, isEmailConfigured, isStripeConfigured, isCloudinaryConfigured } from './env.js';

console.log('🔍 Validating environment configuration...\n');

// Display configuration (hide secrets in production)
console.log('📋 Configuration Summary:');
console.log(`   Environment: ${env.NODE_ENV}`);
console.log(`   Port: ${env.PORT}`);
console.log(`   Database: ${env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'configured'}`);
console.log(`   JWT Secret: ${'•'.repeat(Math.min(env.JWT_SECRET.length, 10))}`);
console.log(`   Frontend URL: ${env.FRONTEND_URL}`);
console.log(`   Upload limit: ${env.MAX_FILE_SIZE_MB}MB`);
console.log(`   Rate limit: ${env.RATE_LIMIT_MAX_REQUESTS} requests per ${env.RATE_LIMIT_WINDOW_MS/1000}s`);

// Check optional services
console.log('\n🔌 Optional Services:');
console.log(`   Email: ${isEmailConfigured() ? '✅ Configured' : '❌ Not configured'}`);
console.log(`   Stripe: ${isStripeConfigured() ? '✅ Configured' : '❌ Not configured'}`);
console.log(`   Cloudinary: ${isCloudinaryConfigured() ? '✅ Configured' : '❌ Not configured'}`);

// Production validation
if (env.NODE_ENV === 'production') {
  validateProductionConfig();
  console.log('\n✅ Production validation passed');
}

console.log('\n✅ Environment validation complete\n');