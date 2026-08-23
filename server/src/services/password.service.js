// server/src/services/password.service.js
import bcrypt from 'bcryptjs';

/**
 * Password Service
 * Handles password validation, hashing, and comparison
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8
 */
class PasswordService {
    /**
     * Validate password strength against security requirements
     * @param {string} password - Password to validate
     * @returns {Object} - { valid: boolean, errors: string[] }
     * 
     * Requirements:
     * - Minimum 8 characters (7.3)
     * - At least one uppercase letter (7.4)
     * - At least one lowercase letter (7.5)
     * - At least one number (7.6)
     * - At least one special character (!@#$%^&*) (7.7)
     */
    validate(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        const errors = [];

        if (password.length < minLength) {
            errors.push('Password must be at least 8 characters');
        }
        if (!hasUpperCase) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!hasLowerCase) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!hasNumber) {
            errors.push('Password must contain at least one number');
        }
        if (!hasSpecialChar) {
            errors.push('Password must contain at least one special character (!@#$%^&*)');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Hash password using bcrypt with 10 salt rounds
     * @param {string} password - Plain text password to hash
     * @returns {Promise<string>} - Hashed password
     * 
     * Requirements:
     * - Use bcrypt hashing (7.8)
     * - Use 10 or more salt rounds (7.8)
     */
    async hash(password) {
        const saltRounds = 10;
        return await bcrypt.hash(password, saltRounds);
    }

    /**
     * Compare plain text password with hashed password
     * @param {string} password - Plain text password
     * @param {string} hash - Hashed password to compare against
     * @returns {Promise<boolean>} - True if password matches hash
     */
    async compare(password, hash) {
        return await bcrypt.compare(password, hash);
    }
}

// Export as singleton instance (default export)
export default new PasswordService();

// Also export as named export for flexibility
export const passwordService = new PasswordService();
