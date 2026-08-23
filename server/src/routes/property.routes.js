import express from 'express';
import propertyController from '../controllers/property.controller.js';
import { upload } from '../middleware/upload.cloudinary.js';
import authMiddleware from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { 
  createPropertySchema,
  updatePropertySchema,
  getPropertiesQuerySchema,
  propertyIdParamSchema,
  deletePropertySchema,
  searchPropertiesSchema
} from '../validations/property.validation.js';

const router = express.Router();

// ==================== Public Routes ====================

// Get all properties with filters
router.get('/', validate(getPropertiesQuerySchema), propertyController.getProperties.bind(propertyController));

// Get featured properties
router.get('/featured', propertyController.getFeaturedProperties.bind(propertyController));

// Search properties
router.get('/search', validate(searchPropertiesSchema), propertyController.searchProperties.bind(propertyController));

// Get property by ID
router.get('/:id', validate(propertyIdParamSchema), propertyController.getPropertyById.bind(propertyController));

// ==================== Protected Routes ====================

// Create property (requires authentication)
router.post('/', 
  authMiddleware.verifyToken, 
  authMiddleware.checkRole(['owner', 'agent', 'admin']),
  validate(createPropertySchema), 
  propertyController.createProperty.bind(propertyController)
);

// Update property (owner only)
router.put('/:id', 
  authMiddleware.verifyToken, 
  validate(updatePropertySchema), 
  propertyController.updateProperty.bind(propertyController)
);

// Delete property (owner only)
router.delete('/:id', 
  authMiddleware.verifyToken, 
  validate(deletePropertySchema), 
  propertyController.deleteProperty.bind(propertyController)
);

// Get user's own properties
router.get('/user/me', 
  authMiddleware.verifyToken, 
  propertyController.getUserProperties.bind(propertyController)
);

router.post(
  '/:id/photos',
  authMiddleware.verifyToken,
  upload.array('photos', 10), // Max 10 photos
  propertyController.uploadPropertyPhotos.bind(propertyController)
);

router.get('/:id/photos', propertyController.getPropertyPhotos.bind(propertyController));
router.delete('/:propertyId/photos/:photoId', authMiddleware.verifyToken, propertyController.deletePropertyPhoto.bind(propertyController));
router.put('/:propertyId/photos/:photoId/primary', authMiddleware.verifyToken, propertyController.setPrimaryPhoto.bind(propertyController));

// ==================== Listing Fee (Chapa Payment) ====================

// Initialize Chapa payment for listing fee
router.post('/:id/listing-fee',
  authMiddleware.verifyToken,
  propertyController.initializeListingFeePayment.bind(propertyController)
);

// Verify Chapa payment after redirect
router.post('/:id/listing-fee/verify',
  authMiddleware.verifyToken,
  propertyController.verifyListingFeePayment.bind(propertyController)
);

export default router;