// Unit tests for validators utility module
import { describe, it, expect } from '@jest/globals';
import {
    validateEmail,
    validatePhone,
    sanitizeString,
    sanitizeForSQL,
    sanitizeForHTML,
    sanitizeForNoSQL,
    sanitizeInput,
    validateAndSanitizeEmail,
    validateAndSanitizePhone
} from './validators.js';

describe('Email Validation', () => {
    it('should validate correct email formats', () => {
        expect(validateEmail('user@example.com')).toBe(true);
        expect(validateEmail('test.user@domain.co.uk')).toBe(true);
        expect(validateEmail('john_doe@company.org')).toBe(true);
        expect(validateEmail('admin@urbannest.com')).toBe(true);
    });

    it('should reject invalid email formats', () => {
        expect(validateEmail('invalid')).toBe(false);
        expect(validateEmail('user@')).toBe(false);
        expect(validateEmail('@domain.com')).toBe(false);
        expect(validateEmail('user@domain')).toBe(false);
        expect(validateEmail('user domain@test.com')).toBe(false);
    });

    it('should handle edge cases', () => {
        expect(validateEmail('')).toBe(false);
        expect(validateEmail(null)).toBe(false);
        expect(validateEmail(undefined)).toBe(false);
        expect(validateEmail('  user@example.com  ')).toBe(true); // Should trim
    });
});

describe('Phone Validation', () => {
    it('should validate correct phone formats', () => {
        expect(validatePhone('1234567890')).toBe(true);
        expect(validatePhone('+251911234567')).toBe(true);
        expect(validatePhone('+1234567890')).toBe(true);
        expect(validatePhone('911234567')).toBe(true);
    });

    it('should reject invalid phone formats', () => {
        expect(validatePhone('abc123')).toBe(false);
        expect(validatePhone('+abc')).toBe(false);
        expect(validatePhone('123-456-7890')).toBe(false);
        expect(validatePhone('(123) 456-7890')).toBe(false);
        expect(validatePhone('123 456 7890')).toBe(false);
    });

    it('should handle edge cases', () => {
        expect(validatePhone('')).toBe(false);
        expect(validatePhone(null)).toBe(false);
        expect(validatePhone(undefined)).toBe(false);
        expect(validatePhone('  +251911234567  ')).toBe(true); // Should trim
    });
});

describe('String Sanitization', () => {
    it('should trim whitespace', () => {
        expect(sanitizeString('  hello  ')).toBe('hello');
        expect(sanitizeString('\n\ttest\n\t')).toBe('test');
    });

    it('should handle empty or invalid input', () => {
        expect(sanitizeString('')).toBe('');
        expect(sanitizeString(null)).toBe('');
        expect(sanitizeString(undefined)).toBe('');
    });
});

describe('SQL Injection Prevention', () => {
    it('should escape single quotes', () => {
        const result = sanitizeForSQL("O'Reilly");
        expect(result).toBe("O''Reilly");
    });

    it('should remove dangerous SQL characters', () => {
        expect(sanitizeForSQL("DROP TABLE users;")).not.toContain(';');
        expect(sanitizeForSQL("SELECT * FROM users--")).not.toContain('--');
        expect(sanitizeForSQL("/* comment */ SELECT")).not.toContain('/*');
    });

    it('should handle empty input', () => {
        expect(sanitizeForSQL('')).toBe('');
        expect(sanitizeForSQL(null)).toBe('');
    });
});

describe('XSS Prevention', () => {
    it('should escape HTML special characters', () => {
        expect(sanitizeForHTML('<script>alert("xss")</script>'))
            .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');

        expect(sanitizeForHTML('Test & Company')).toBe('Test &amp; Company');
        expect(sanitizeForHTML('<div>')).toBe('&lt;div&gt;');
    });

    it('should handle quotes and apostrophes', () => {
        expect(sanitizeForHTML("It's \"quoted\""))
            .toBe("It&#x27;s &quot;quoted&quot;");
    });
});

describe('NoSQL Injection Prevention', () => {
    it('should remove NoSQL injection characters', () => {
        expect(sanitizeForNoSQL('user$gt')).not.toContain('$');
        expect(sanitizeForNoSQL('{$ne: null}')).not.toContain('$');
        expect(sanitizeForNoSQL('{$ne: null}')).not.toContain('{');
        expect(sanitizeForNoSQL('{$ne: null}')).not.toContain('}');
    });
});

describe('General Input Sanitization', () => {
    it('should remove null bytes and control characters', () => {
        expect(sanitizeInput('test\x00string')).toBe('teststring');
        expect(sanitizeInput('hello\x01world')).toBe('helloworld');
    });

    it('should preserve newlines and tabs', () => {
        expect(sanitizeInput('line1\nline2')).toBe('line1\nline2');
        expect(sanitizeInput('col1\tcol2')).toBe('col1\tcol2');
    });

    it('should trim whitespace', () => {
        expect(sanitizeInput('  hello  ')).toBe('hello');
    });
});

describe('Combined Validation and Sanitization', () => {
    it('should validate and sanitize email correctly', () => {
        const result1 = validateAndSanitizeEmail('  user@example.com  ');
        expect(result1.valid).toBe(true);
        expect(result1.sanitized).toBe('user@example.com');
        expect(result1.error).toBeNull();

        const result2 = validateAndSanitizeEmail('invalid-email');
        expect(result2.valid).toBe(false);
        expect(result2.error).toBe('Invalid email format');
    });

    it('should validate and sanitize phone correctly', () => {
        const result1 = validateAndSanitizePhone('  +251911234567  ');
        expect(result1.valid).toBe(true);
        expect(result1.sanitized).toBe('+251911234567');
        expect(result1.error).toBeNull();

        const result2 = validateAndSanitizePhone('123-456-7890');
        expect(result2.valid).toBe(false);
        expect(result2.error).toBe('Invalid phone format. Use digits with optional + prefix');
    });
});
