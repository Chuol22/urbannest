import { body, param, query } from 'express-validator';

const userValidation = {
  // ==================== Auth Validation Schemas ====================
  registerSchema: [
    body('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail(),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    
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
      .withMessage('Please provide a valid phone number'),
    
    body('role')
      .optional()
      .isIn(['seeker', 'owner', 'agent'])
      .withMessage('Invalid role')
  ],

  loginSchema: [
    body('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Invalid email format'),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],

  forgotPasswordSchema: [
    body('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Invalid email format')
  ],

  resetPasswordSchema: [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required'),
    
    body('newPassword')
      .notEmpty()
      .withMessage('New password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
  ],

  changePasswordSchema: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    
    body('newPassword')
      .notEmpty()
      .withMessage('New password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
  ],

  checkEmailSchema: [
    body('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Invalid email format')
  ],

  verify2FASchema: [
    body('code')
      .notEmpty()
      .withMessage('2FA code is required')
      .isLength({ min: 6, max: 6 })
      .withMessage('2FA code must be 6 digits')
      .isNumeric()
      .withMessage('2FA code must contain only numbers')
  ],

  // ==================== Profile Validation Schemas ====================
  updateProfileSchema: [
    body('first_name')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s-']+$/)
      .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),
    
    body('last_name')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s-']+$/)
      .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),
    
    body('phone')
      .optional()
      .matches(/^\+?[0-9]{10,15}$/)
      .withMessage('Please provide a valid phone number'),
    
    body('avatar_url')
      .optional()
      .isURL()
      .withMessage('Avatar URL must be a valid URL')
  ],

  // ==================== Settings Validation Schemas ====================
  updateSettingsSchema: [
    body('notifications')
      .optional()
      .isObject()
      .withMessage('Notifications must be an object'),
    
    body('notifications.email')
      .optional()
      .isBoolean()
      .withMessage('Email notification setting must be a boolean'),
    
    body('notifications.push')
      .optional()
      .isBoolean()
      .withMessage('Push notification setting must be a boolean'),
    
    body('notifications.sms')
      .optional()
      .isBoolean()
      .withMessage('SMS notification setting must be a boolean'),
    
    body('privacy')
      .optional()
      .isObject()
      .withMessage('Privacy settings must be an object'),
    
    body('privacy.showProfile')
      .optional()
      .isBoolean()
      .withMessage('Show profile setting must be a boolean'),
    
    body('privacy.showListings')
      .optional()
      .isBoolean()
      .withMessage('Show listings setting must be a boolean')
  ],

  updateNotificationPreferencesSchema: [
    body('email_notifications')
      .optional()
      .isBoolean()
      .withMessage('Email notifications must be a boolean'),
    
    body('push_notifications')
      .optional()
      .isBoolean()
      .withMessage('Push notifications must be a boolean'),
    
    body('sms_notifications')
      .optional()
      .isBoolean()
      .withMessage('SMS notifications must be a boolean'),
    
    body('marketing_emails')
      .optional()
      .isBoolean()
      .withMessage('Marketing emails must be a boolean'),
    
    body('booking_reminders')
      .optional()
      .isBoolean()
      .withMessage('Booking reminders must be a boolean'),
    
    body('message_notifications')
      .optional()
      .isBoolean()
      .withMessage('Message notifications must be a boolean')
  ],

  // ==================== Account Management Schemas ====================
  deactivateAccountSchema: [
    body('password')
      .notEmpty()
      .withMessage('Password is required to deactivate account'),
    
    body('reason')
      .optional()
      .isString()
      .withMessage('Reason must be a string')
      .isLength({ max: 500 })
      .withMessage('Reason cannot exceed 500 characters')
  ],

  // ==================== Parameter Validation Schemas ====================
  userIdParamSchema: [
    param('id')
      .isUUID()
      .withMessage('Invalid user ID format')
  ],

  getUserListingsQuerySchema: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('status')
      .optional()
      .isIn(['available', 'pending', 'sold', 'rented', 'off_market'])
      .withMessage('Invalid property status')
  ],

  // ==================== Phone Validation Schemas ====================
  verifyPhoneSchema: [
    body('code')
      .notEmpty()
      .withMessage('Verification code is required')
      .isLength({ min: 6, max: 6 })
      .withMessage('Verification code must be 6 digits')
      .isNumeric()
      .withMessage('Verification code must contain only numbers')
  ],

  // ==================== Block User Schemas ====================
  blockUserSchema: [
    param('userId')
      .isUUID()
      .withMessage('Invalid user ID format')
      .custom((value, { req }) => value !== req.user?.id)
      .withMessage('You cannot block yourself')
  ]
};

export default userValidation;