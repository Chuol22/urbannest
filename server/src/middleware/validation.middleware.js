import { validationResult } from "express-validator";

/**
 * Middleware to validate request data
 * @param {Array} validations - Array of express-validator validation chains
 * @param {string} type - Type of validation (body, query, params)
 * @returns {Function} Express middleware
 */
const validate = (validations, type = 'body') => {
  return async (req, res, next) => {
    console.log('[VALIDATION] Running validations for:', req.method, req.path);
    console.log('[VALIDATION] Request body:', JSON.stringify(req.body, null, 2));

    // Run all validations
    for (const validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    // Check for validation errors
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      console.log('[VALIDATION] Validation passed');
      return next();
    }

    console.error('[VALIDATION] Validation failed');
    console.error('[VALIDATION] Errors:', errors.array());

    // Format errors
    const formattedErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value,
      location: error.location
    }));

    // Group errors by field
    const groupedErrors = formattedErrors.reduce((acc, error) => {
      if (!acc[error.field]) {
        acc[error.field] = [];
      }
      acc[error.field].push(error.message);
      return acc;
    }, {});

    // Create a user-friendly error message
    const errorMessages = formattedErrors.map(e => `${e.field}: ${e.message}`).join('; ');

    console.error('[VALIDATION] User-friendly error:', errorMessages);

    return res.status(400).json({
      success: false,
      message: `Validation failed: ${errorMessages}`,
      errors: formattedErrors,
      groupedErrors,
      timestamp: new Date().toISOString()
    });
  };
};

/**
 * Custom validation rules
 */
const customValidators = {
  /**
   * Check if value is a valid phone number
   */
  isPhoneNumber: (value) => {
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    return phoneRegex.test(value);
  },

  /**
   * Check if value is a valid password
   */
  isStrongPassword: (value) => {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    return passwordRegex.test(value);
  },

  /**
   * Check if date is in the future
   */
  isFutureDate: (value) => {
    const date = new Date(value);
    const now = new Date();
    return date > now;
  },

  /**
   * Check if value is a valid UUID
   */
  isUUID: (value) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  },

  /**
   * Check if array contains unique values
   */
  isArrayUnique: (array) => {
    return new Set(array).size === array.length;
  },

  /**
   * Check if value is within range
   */
  isInRange: (value, min, max) => {
    const num = parseFloat(value);
    return num >= min && num <= max;
  },

  /**
   * Check if string contains only letters and spaces
   */
  isAlphaWithSpaces: (value) => {
    const alphaRegex = /^[a-zA-Z\s]+$/;
    return alphaRegex.test(value);
  },

  /**
   * Check if string contains only alphanumeric characters
   */
  isAlphanumericWithSpaces: (value) => {
    const alphanumRegex = /^[a-zA-Z0-9\s]+$/;
    return alphanumRegex.test(value);
  }
};

// ✅ CORRECT ES6 EXPORT SYNTAX
export { validate, customValidators };