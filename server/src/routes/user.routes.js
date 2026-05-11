import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import userValidation from '../validations/user.validation.js';
import { upload } from '../middleware/upload.cloudinary.js';
import { validate } from '../middleware/validation.middleware.js';

// Import controller with error handling
let userController;
try {
  userController = (await import('../controllers/user.controller.js')).default;
} catch (error) {
  console.error('Failed to import user controller:', error);
  // Create a fallback controller with all methods
  userController = {
    getProfile: (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }),
    updateProfile: (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }),
    uploadAvatar: (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }),
    removeAvatar: (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }),
    getUserById: (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }),
    getUserListings: (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }),
    getFavorites: (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }),
    getUserBookings: (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }),
    getSettings: (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }),
    updateSettings: (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }),
    getNotificationPreferences: (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }),
    updateNotificationPreferences: (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }),
    getUserStatistics: (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }),
    getActivityLog: (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }),
    changePassword: (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }),
    deactivateAccount: (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }),
    reactivateAccount: (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }),
    requestPhoneVerification: (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }),
    confirmPhoneVerification: (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }),
    exportUserData: (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }),
    getUserReviews: (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }),
    getWrittenReviews: (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }),
    blockUser: (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }),
    unblockUser: (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }),
    getBlockedUsers: (req, res) => res.status(501).json({ success: false, message: 'Not implemented' })
  };
}

const router = express.Router();

// Helper function to safely wrap controller methods
const safeHandler = (handler) => {
  return async (req, res, next) => {
    try {
      if (typeof handler !== 'function') {
        throw new Error(`Handler is not a function: ${handler}`);
      }
      await handler(req, res, next);
    } catch (error) {
      console.error('Route handler error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
    }
  };
};

// ==================== Public Routes ====================

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID (public profile)
 *     tags: [Users]
 */
router.get('/:id', 
  validate(userValidation.userIdParamSchema), 
  safeHandler(userController.getUserById)
);

/**
 * @swagger
 * /api/users/{id}/listings:
 *   get:
 *     summary: Get user's property listings
 *     tags: [Users]
 */
router.get('/:id/listings', 
  validate(userValidation.userIdParamSchema),
  safeHandler(userController.getUserListings)
);

// ==================== Protected Routes ====================

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get('/me', 
  authMiddleware.verifyToken, 
  safeHandler(userController.getProfile)
);

router.get('/profile', 
  authMiddleware.verifyToken, 
  safeHandler(userController.getProfile)
);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.put('/profile', 
  authMiddleware.verifyToken, 
  validate(userValidation.updateProfileSchema), 
  safeHandler(userController.updateProfile)
);

/**
 * @swagger
 * /api/users/avatar:
 *   post:
 *     summary: Upload profile avatar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.post('/avatar', 
  authMiddleware.verifyToken, 
  upload.single('avatar'),
  safeHandler(userController.uploadAvatar)
);

/**
 * @swagger
 * /api/users/avatar:
 *   delete:
 *     summary: Remove profile avatar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/avatar', 
  authMiddleware.verifyToken, 
  safeHandler(userController.removeAvatar)
);

/**
 * @swagger
 * /api/users/favorites:
 *   get:
 *     summary: Get user's favorite properties
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get('/favorites', 
  authMiddleware.verifyToken, 
  safeHandler(userController.getFavorites)
);

/**
 * @swagger
 * /api/users/bookings:
 *   get:
 *     summary: Get user's bookings
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get('/bookings', 
  authMiddleware.verifyToken, 
  safeHandler(userController.getUserBookings)
);

/**
 * @swagger
 * /api/users/settings:
 *   get:
 *     summary: Get user settings
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get('/settings', 
  authMiddleware.verifyToken, 
  safeHandler(userController.getSettings)
);

/**
 * @swagger
 * /api/users/settings:
 *   put:
 *     summary: Update user settings
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.put('/settings', 
  authMiddleware.verifyToken, 
  validate(userValidation.updateSettingsSchema), 
  safeHandler(userController.updateSettings)
);

/**
 * @swagger
 * /api/users/notifications:
 *   get:
 *     summary: Get notification preferences
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get('/notifications', 
  authMiddleware.verifyToken, 
  safeHandler(userController.getNotificationPreferences)
);

/**
 * @swagger
 * /api/users/notifications:
 *   put:
 *     summary: Update notification preferences
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.put('/notifications', 
  authMiddleware.verifyToken, 
  validate(userValidation.updateNotificationPreferencesSchema), 
  safeHandler(userController.updateNotificationPreferences)
);

/**
 * @swagger
 * /api/users/statistics:
 *   get:
 *     summary: Get user statistics
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get('/statistics', 
  authMiddleware.verifyToken, 
  safeHandler(userController.getUserStatistics)
);

/**
 * @swagger
 * /api/users/activity:
 *   get:
 *     summary: Get user activity log
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get('/activity', 
  authMiddleware.verifyToken, 
  safeHandler(userController.getActivityLog)
);

/**
 * @swagger
 * /api/users/change-password:
 *   put:
 *     summary: Change user password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.put('/change-password', 
  authMiddleware.verifyToken, 
  safeHandler(userController.changePassword)
);

/**
 * @swagger
 * /api/users/deactivate:
 *   delete:
 *     summary: Deactivate user account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/deactivate', 
  authMiddleware.verifyToken, 
  validate(userValidation.deactivateAccountSchema), 
  safeHandler(userController.deactivateAccount)
);

/**
 * @swagger
 * /api/users/reactivate:
 *   post:
 *     summary: Reactivate user account
 *     tags: [Users]
 */
router.post('/reactivate', 
  safeHandler(userController.reactivateAccount)
);

/**
 * @swagger
 * /api/users/verify-phone:
 *   post:
 *     summary: Request phone verification
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.post('/verify-phone', 
  authMiddleware.verifyToken, 
  safeHandler(userController.requestPhoneVerification)
);

/**
 * @swagger
 * /api/users/verify-phone/confirm:
 *   post:
 *     summary: Confirm phone verification
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.post('/verify-phone/confirm', 
  authMiddleware.verifyToken, 
  validate(userValidation.verifyPhoneSchema), 
  safeHandler(userController.confirmPhoneVerification)
);

/**
 * @swagger
 * /api/users/export-data:
 *   get:
 *     summary: Export user data (GDPR)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get('/export-data', 
  authMiddleware.verifyToken, 
  safeHandler(userController.exportUserData)
);

/**
 * @swagger
 * /api/users/reviews:
 *   get:
 *     summary: Get reviews about the user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get('/reviews', 
  authMiddleware.verifyToken, 
  safeHandler(userController.getUserReviews)
);

/**
 * @swagger
 * /api/users/reviews/as-author:
 *   get:
 *     summary: Get reviews written by the user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get('/reviews/as-author', 
  authMiddleware.verifyToken, 
  safeHandler(userController.getWrittenReviews)
);

/**
 * @swagger
 * /api/users/block/{userId}:
 *   post:
 *     summary: Block another user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.post('/block/:userId', 
  authMiddleware.verifyToken, 
  validate(userValidation.blockUserSchema), 
  safeHandler(userController.blockUser)
);

/**
 * @swagger
 * /api/users/unblock/{userId}:
 *   post:
 *     summary: Unblock a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.post('/unblock/:userId', 
  authMiddleware.verifyToken, 
  safeHandler(userController.unblockUser)
);

/**
 * @swagger
 * /api/users/blocked:
 *   get:
 *     summary: Get blocked users list
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get('/blocked', 
  authMiddleware.verifyToken, 
  safeHandler(userController.getBlockedUsers)
);

export default router;