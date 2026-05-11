import express from 'express';
import favoriteController from '../controllers/favorite.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { 
  addFavoriteSchema,
  updateFavoriteSchema,
  bulkRemoveSchema,
  addTagsSchema
} from '../validations/favorite.validation.js';

const router = express.Router();

// ==================== Public Routes ====================
router.get('/most-favorited', favoriteController.getMostFavorited);

// ==================== Protected Routes ====================

// Core favorite operations
router.post('/',
  authMiddleware.verifyToken,
  validate(addFavoriteSchema),
  favoriteController.addToFavorites
);

router.get('/',
  authMiddleware.verifyToken,
  favoriteController.getFavorites
);

router.get('/stats',
  authMiddleware.verifyToken,
  favoriteController.getFavoriteStats
);

router.get('/collections',
  authMiddleware.verifyToken,
  favoriteController.getCollections
);

router.get('/collections/:type',
  authMiddleware.verifyToken,
  favoriteController.getFavoritesByType
);

router.get('/tags',
  authMiddleware.verifyToken,
  favoriteController.getUserTags
);

router.get('/search',
  authMiddleware.verifyToken,
  favoriteController.searchFavorites
);

router.get('/check/:propertyId',
  authMiddleware.verifyToken,
  favoriteController.checkFavorite
);

router.get('/notifications/settings',
  authMiddleware.verifyToken,
  favoriteController.getNotificationSettings
);

router.get('/updates',
  authMiddleware.verifyToken,
  favoriteController.getPropertyUpdates
);

router.get('/export',
  authMiddleware.verifyToken,
  favoriteController.exportFavorites
);

router.get('/suggestions',
  authMiddleware.verifyToken,
  favoriteController.getSuggestions
);

// Single favorite operations
router.get('/:id',
  authMiddleware.verifyToken,
  favoriteController.getFavoriteById
);

router.patch('/:id',
  authMiddleware.verifyToken,
  validate(updateFavoriteSchema),
  favoriteController.updateFavorite
);

router.delete('/:id',
  authMiddleware.verifyToken,
  favoriteController.removeFromFavorites
);

// Tags operations
router.post('/:id/tags',
  authMiddleware.verifyToken,
  validate(addTagsSchema),
  favoriteController.addTags
);

router.delete('/:id/tags',
  authMiddleware.verifyToken,
  validate(addTagsSchema),
  favoriteController.removeTags
);

// Notification settings
router.patch('/:id/notifications',
  authMiddleware.verifyToken,
  favoriteController.updateNotificationSettings
);

// Priority and expiration
router.patch('/:id/priority',
  authMiddleware.verifyToken,
  favoriteController.updatePriority
);

router.post('/:id/extend',
  authMiddleware.verifyToken,
  favoriteController.extendExpiration
);

// Bulk operations
router.post('/bulk/add',
  authMiddleware.verifyToken,
  favoriteController.bulkAddFavorites
);

router.post('/bulk/remove',
  authMiddleware.verifyToken,
  validate(bulkRemoveSchema),
  favoriteController.bulkRemoveFavorites
);

router.patch('/bulk/update-type',
  authMiddleware.verifyToken,
  favoriteController.bulkUpdateType
);

router.post('/bulk/add-tags',
  authMiddleware.verifyToken,
  favoriteController.bulkAddTags
);

router.post('/bulk/remove-tags',
  authMiddleware.verifyToken,
  favoriteController.bulkRemoveTags
);

router.patch('/bulk/update-notifications',
  authMiddleware.verifyToken,
  favoriteController.bulkUpdateNotifications
);

// Compare favorites
router.post('/compare',
  authMiddleware.verifyToken,
  favoriteController.compareFavorites
);

// ==================== Admin Only Routes ====================
router.post('/clean-expired',
  authMiddleware.verifyToken,
  authMiddleware.checkRole(['admin']),
  favoriteController.cleanExpiredFavorites
);

export default router;