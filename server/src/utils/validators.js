// Validation utilities for input validation and sanitization
// Used throughout the application for email, phone, and input validation

/**
 * Validate email format using regex
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid email format
 */
export const validateEmail = (email) => {
    if (!email || typeof email !== 'string') {
        return false;
    }

    // Email regex pattern: local-part@domain
    // Allows alphanumeric, dots, hyphens, underscores in local part
    // Requires @ symbol and valid domain with TLD
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    return emailRegex.test(email.trim());
};

/**
 * Validate phone number format (digits with optional + prefix for international format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid phone format
 */
export const validatePhone = (phone) => {
    if (!phone || typeof phone !== 'string') {
        return false;
    }

    // Phone regex pattern: optional + prefix followed by digits only
    // Allows international format like +251911234567
    const phoneRegex = /^\+?\d+$/;

    return phoneRegex.test(phone.trim());
};

/**
 * Sanitize string input by trimming whitespace
 * @param {string} input - Input string to sanitize
 * @returns {string} - Sanitized string
 */
export const sanitizeString = (input) => {
    if (!input || typeof input !== 'string') {
        return '';
    }

    // Trim leading and trailing whitespace
    return input.trim();
};

/**
 * Sanitize input to prevent SQL injection by escaping special characters
 * Note: This is a basic sanitization. Always use parameterized queries for SQL.
 * @param {string} input - Input string to sanitize
 * @returns {string} - Sanitized string with escaped characters
 */
export const sanitizeForSQL = (input) => {
    if (!input || typeof input !== 'string') {
        return '';
    }

    // Remove or escape potentially dangerous SQL characters
    // Replace single quotes with two single quotes (SQL escape)
    return input
        .trim()
        .replace(/'/g, "''")
        .replace(/;/g, '')
        .replace(/--/g, '')
        .replace(/\/\*/g, '')
        .replace(/\*\//g, '');
};

/**
 * Sanitize input to prevent XSS attacks by escaping HTML special characters
 * @param {string} input - Input string to sanitize
 * @returns {string} - Sanitized string with escaped HTML entities
 */
export const sanitizeForHTML = (input) => {
    if (!input || typeof input !== 'string') {
        return '';
    }

    // Escape HTML special characters to prevent XSS
    const htmlEntities = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;'
    };

    return input.replace(/[&<>"'/]/g, (char) => htmlEntities[char]);
};

/**
 * Sanitize input to prevent NoSQL injection attacks
 * @param {string} input - Input string to sanitize
 * @returns {string} - Sanitized string
 */
export const sanitizeForNoSQL = (input) => {
    if (!input || typeof input !== 'string') {
        return '';
    }

    // Remove characters commonly used in NoSQL injection
    return input
        .trim()
        .replace(/[${}]/g, '');
};

/**
 * General purpose input sanitization combining multiple techniques
 * Trims whitespace and prevents common injection attacks
 * @param {string} input - Input string to sanitize
 * @returns {string} - Sanitized string
 */
export const sanitizeInput = (input) => {
    if (!input || typeof input !== 'string') {
        return '';
    }

    let sanitized = input.trim();

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Remove control characters (except newlines and tabs)
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    return sanitized;
};

/**
 * Validate and sanitize email
 * @param {string} email - Email to validate and sanitize
 * @returns {Object} - { valid: boolean, sanitized: string, error: string }
 */
export const validateAndSanitizeEmail = (email) => {
    const sanitized = sanitizeInput(email);
    const valid = validateEmail(sanitized);

    return {
        valid,
        sanitized,
        error: valid ? null : 'Invalid email format'
    };
};

/**
 * Validate and sanitize phone number
 * @param {string} phone - Phone number to validate and sanitize
 * @returns {Object} - { valid: boolean, sanitized: string, error: string }
 */
export const validateAndSanitizePhone = (phone) => {
    const sanitized = sanitizeInput(phone);
    const valid = validatePhone(sanitized);

    return {
        valid,
        sanitized,
        error: valid ? null : 'Invalid phone format. Use digits with optional + prefix'
    };
};

// Export all validators as default object for convenience
export default {
    validateEmail,
    validatePhone,
    sanitizeString,
    sanitizeForSQL,
    sanitizeForHTML,
    sanitizeForNoSQL,
    sanitizeInput,
    validateAndSanitizeEmail,
    validateAndSanitizePhone
};
