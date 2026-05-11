import { validationResult } from 'express-validator';

/**
 * Middleware to validate request using express-validator
 * @param {Array} validations - Array of express-validator validation chains
 * @returns {Function} Express middleware
 */
export const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    // Check for validation errors
    const errors = validationResult(req);
    
    if (errors.isEmpty()) {
      return next();
    }

    // Format errors
    const formattedErrors = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));

    // Return validation errors
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    });
  };
};

// Alternative if you need to validate single validation array
export const validateRequest = (validations) => {
  return async (req, res, next) => {
    if (validations) {
      await Promise.all(validations.map(validation => validation.run(req)));
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const formattedErrors = errors.array().map(error => ({
      field: error.param,
      message: error.msg
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    });
  };
};