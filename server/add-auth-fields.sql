-- Add missing authentication security fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_login_attempts ON users(login_attempts);
CREATE INDEX IF NOT EXISTS idx_users_locked_until ON users(locked_until);
