// server/src/services/password.service.test.js
import { describe, test, expect } from '@jest/globals';
import passwordService from './password.service.js';

describe('PasswordService', () => {
    describe('validate()', () => {
        test('should validate a strong password successfully', () => {
            const result = passwordService.validate('SecurePass123!');
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test('should reject password shorter than 8 characters', () => {
            const result = passwordService.validate('Short1!');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Password must be at least 8 characters');
        });

        test('should reject password without uppercase letter', () => {
            const result = passwordService.validate('lowercase123!');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one uppercase letter');
        });

        test('should reject password without lowercase letter', () => {
            const result = passwordService.validate('UPPERCASE123!');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one lowercase letter');
        });

        test('should reject password without number', () => {
            const result = passwordService.validate('NoNumbers!');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one number');
        });

        test('should reject password without special character', () => {
            const result = passwordService.validate('NoSpecial123');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one special character (!@#$%^&*)');
        });

        test('should return multiple errors for weak password', () => {
            const result = passwordService.validate('weak');
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(1);
            expect(result.errors).toContain('Password must be at least 8 characters');
            expect(result.errors).toContain('Password must contain at least one uppercase letter');
            expect(result.errors).toContain('Password must contain at least one number');
            expect(result.errors).toContain('Password must contain at least one special character (!@#$%^&*)');
        });

        test('should accept various special characters', () => {
            const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', ',', '.', '?', '"', ':', '{', '}', '|', '<', '>'];

            specialChars.forEach(char => {
                const password = `Password1${char}`;
                const result = passwordService.validate(password);
                expect(result.valid).toBe(true);
            });
        });
    });

    describe('hash()', () => {
        test('should hash a password successfully', async () => {
            const password = 'SecurePass123!';
            const hash = await passwordService.hash(password);

            expect(hash).toBeDefined();
            expect(hash).not.toBe(password);
            expect(hash.length).toBeGreaterThan(0);
            expect(hash).toMatch(/^\$2[aby]\$/); // bcrypt hash format
        });

        test('should generate different hashes for the same password', async () => {
            const password = 'SecurePass123!';
            const hash1 = await passwordService.hash(password);
            const hash2 = await passwordService.hash(password);

            expect(hash1).not.toBe(hash2); // Due to random salt
        });
    });

    describe('compare()', () => {
        test('should return true for matching password and hash', async () => {
            const password = 'SecurePass123!';
            const hash = await passwordService.hash(password);

            const result = await passwordService.compare(password, hash);
            expect(result).toBe(true);
        });

        test('should return false for non-matching password and hash', async () => {
            const password = 'SecurePass123!';
            const wrongPassword = 'WrongPass456!';
            const hash = await passwordService.hash(password);

            const result = await passwordService.compare(wrongPassword, hash);
            expect(result).toBe(false);
        });

        test('should handle case-sensitive password comparison', async () => {
            const password = 'SecurePass123!';
            const hash = await passwordService.hash(password);

            const result = await passwordService.compare('securepass123!', hash);
            expect(result).toBe(false);
        });
    });

    describe('Integration', () => {
        test('should validate, hash, and compare password end-to-end', async () => {
            const password = 'MySecure123!';

            // Validate
            const validation = passwordService.validate(password);
            expect(validation.valid).toBe(true);

            // Hash
            const hash = await passwordService.hash(password);
            expect(hash).toBeDefined();

            // Compare
            const isMatch = await passwordService.compare(password, hash);
            expect(isMatch).toBe(true);
        });
    });
});
