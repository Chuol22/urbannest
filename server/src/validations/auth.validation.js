import { body } from 'express-validator';

// Register validation schema
export const registerSchema = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage('Password must contain at least one letter and one number'),
  
  body('first_name')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s-']+$/)
    .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),
  
  body('last_name')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s-']+$/)
    .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),
  
  body('phone')
    .optional()
    .matches(/^\+?[0-9]{10,15}$/)
    .withMessage('Please provide a valid phone number')
];

// Login validation schema
export const loginSchema = [
  body('email')
    .notEmpty()
    .withMessage('Email or phone number is required')
    .custom((value) => {
      // Check if it's a valid email or phone number
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      const isPhone = /^\+?[0-9]{10,15}$/.test(value);
      if (!isEmail && !isPhone) {
        throw new Error('Please provide a valid email or phone number');
      }
      return true;
    }),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Change password validation schema
export const changePasswordSchema = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage('New password must contain at least one letter and one number'),
  
  body('confirmPassword')
    .notEmpty()
    .withMessage('Please confirm your new password')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Passwords do not match')
];

// Forgot password validation schema
export const forgotPasswordSchema = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
];

// Reset password validation schema
export const resetPasswordSchema = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage('Password must contain at least one letter and one number'),
  
  body('confirmPassword')
    .notEmpty()
    .withMessage('Please confirm your new password')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Passwords do not match')
];

// Refresh token validation schema
export const refreshTokenSchema = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
];

// Email verification schema
export const verifyEmailSchema = [
  body('token')
    .notEmpty()
    .withMessage('Verification token is required')
];

// Resend verification schema
export const resendVerificationSchema = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
];

// Logout schema (optional, might not need validation)
export const logoutSchema = [
  body('refreshToken')
    .optional()
];

// If you prefer a default export as well
export default {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  logoutSchema
};