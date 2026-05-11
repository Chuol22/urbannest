import express from 'express';
import propertyPhotoController from '../controllers/propertyphoto.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import {upload} from '../middleware/upload.cloudinary.js';
import { validate } from '../middleware/validation.middleware.js';
import { 
  updatePhotoSchema,
  reorderPhotosSchema,
  bulkDeleteSchema,
  uploadPhotosSchema,
  completeUploadSchema,
  applyWatermarkSchema
} from '../validations/propertyphoto.validation.js';

const router = express.Router({ mergeParams: true });

// ==================== Property Photos Routes ====================

/**
 * @swagger
 * tags:
 *   name: Property Photos
 *   description: Property photo management
 */

// Upload photos for a property
router.post('/',
  authMiddleware.verifyToken,
  upload.array('photos', 20),
  propertyPhotoController.uploadPhotos
);

// Get all photos for a property
router.get('/', propertyPhotoController.getPropertyPhotos);

// Reorder property photos
router.post('/reorder',
  authMiddleware.verifyToken,
  validate(reorderPhotosSchema),
  propertyPhotoController.reorderPhotos
);

// Bulk delete photos
router.post('/bulk-delete',
  authMiddleware.verifyToken,
  validate(bulkDeleteSchema),
  propertyPhotoController.bulkDeletePhotos
);

// Get photo count for property
router.get('/count', propertyPhotoController.getPhotoCount);

// Get primary photo for property
router.get('/primary', propertyPhotoController.getPrimaryPhoto);

// Apply watermark to photos
router.post('/watermark',
  authMiddleware.verifyToken,
  validate(applyWatermarkSchema),
  propertyPhotoController.applyWatermark
);

// Regenerate thumbnails for photos
router.post('/regenerate-thumbnails',
  authMiddleware.verifyToken,
  propertyPhotoController.regenerateThumbnails
);

// Download all property photos as ZIP
router.get('/download',
  authMiddleware.verifyToken,
  propertyPhotoController.downloadAllPhotos
);

// Export all photo URLs
router.get('/export-urls', propertyPhotoController.exportPhotoUrls);

// Get photo statistics for property
router.get('/stats', propertyPhotoController.getPhotoStats);

// ==================== Single Photo Routes ====================

// Get single photo by ID
router.get('/:photoId', propertyPhotoController.getPhotoById);

// Update photo details
router.patch('/:photoId',
  authMiddleware.verifyToken,
  validate(updatePhotoSchema),
  propertyPhotoController.updatePhoto
);

// Set photo as primary
router.patch('/:photoId/set-primary',
  authMiddleware.verifyToken,
  propertyPhotoController.setPrimaryPhoto
);

// Delete photo
router.delete('/:photoId',
  authMiddleware.verifyToken,
  propertyPhotoController.deletePhoto
);

// ==================== Direct Upload Routes ====================

// Get presigned URL for direct upload
router.get('/upload-url',
  authMiddleware.verifyToken,
  propertyPhotoController.getUploadUrl
);

// Complete direct upload and create photo record
router.post('/upload/complete',
  authMiddleware.verifyToken,
  validate(completeUploadSchema),
  propertyPhotoController.completeUpload
);

// Validate photos before upload
router.post('/validate',
  authMiddleware.verifyToken,
  propertyPhotoController.validatePhotos
);

// ==================== Global Photo Routes ====================

// Bulk delete photos by IDs
router.post('/bulk/delete',
  authMiddleware.verifyToken,
  validate(bulkDeleteSchema),
  propertyPhotoController.bulkDeletePhotosByIds
);

// Get recently uploaded photos
router.get('/recent', propertyPhotoController.getRecentPhotos);

// Search photos by caption or tags
router.get('/search', propertyPhotoController.searchPhotos);

export default router;