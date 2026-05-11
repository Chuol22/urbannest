import { body, param, query } from 'express-validator';

const propertyPhotoValidation = {
  updatePhotoSchema: [
    param('photoId')
      .isUUID()
      .withMessage('Invalid photo ID format'),
    
    body('caption')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Caption cannot exceed 500 characters')
      .trim()
      .escape(),
    
    body('altText')
      .optional()
      .isLength({ max: 255 })
      .withMessage('Alt text cannot exceed 255 characters')
      .trim()
      .escape(),
    
    body('displayOrder')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Display order must be a positive integer')
  ],

  reorderPhotosSchema: [
    param('propertyId')
      .isUUID()
      .withMessage('Invalid property ID format'),
    
    body('photoOrder')
      .isArray({ min: 1 })
      .withMessage('Photo order must be an array with at least one item'),
    
    body('photoOrder.*')
      .isUUID()
      .withMessage('Each photo ID must be a valid UUID')
  ],

  bulkDeleteSchema: [
    body('photoIds')
      .isArray({ min: 1 })
      .withMessage('Photo IDs must be an array with at least one item'),
    
    body('photoIds.*')
      .isUUID()
      .withMessage('Each photo ID must be a valid UUID')
  ],

  uploadPhotosSchema: [
    param('propertyId')
      .isUUID()
      .withMessage('Invalid property ID format'),
    
    body('captions')
      .optional()
      .isArray()
      .withMessage('Captions must be an array'),
    
    body('captions.*')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Each caption cannot exceed 500 characters'),
    
    body('alt_texts')
      .optional()
      .isArray()
      .withMessage('Alt texts must be an array'),
    
    body('alt_texts.*')
      .optional()
      .isLength({ max: 255 })
      .withMessage('Each alt text cannot exceed 255 characters')
  ],

  getUploadUrlSchema: [
    query('fileName')
      .notEmpty()
      .withMessage('File name is required')
      .matches(/^[a-zA-Z0-9._-]+$/)
      .withMessage('File name contains invalid characters'),
    
    query('fileType')
      .notEmpty()
      .withMessage('File type is required')
      .isIn(['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
      .withMessage('File type must be JPEG, PNG, WEBP, or HEIC')
  ],

  completeUploadSchema: [
    body('propertyId')
      .isUUID()
      .withMessage('Invalid property ID format'),
    
    body('fileKey')
      .notEmpty()
      .withMessage('File key is required')
      .isString()
      .withMessage('File key must be a string'),
    
    body('fileName')
      .notEmpty()
      .withMessage('File name is required')
      .isString()
      .withMessage('File name must be a string'),
    
    body('fileSize')
      .notEmpty()
      .withMessage('File size is required')
      .isInt({ min: 1, max: 10485760 })
      .withMessage('File size must be between 1 byte and 10MB'),
    
    body('mimeType')
      .notEmpty()
      .withMessage('MIME type is required')
      .isIn(['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
      .withMessage('Invalid MIME type'),
    
    body('caption')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Caption cannot exceed 500 characters'),
    
    body('altText')
      .optional()
      .isLength({ max: 255 })
      .withMessage('Alt text cannot exceed 255 characters'),
    
    body('isPrimary')
      .optional()
      .isBoolean()
      .withMessage('isPrimary must be a boolean')
  ],

  applyWatermarkSchema: [
    param('propertyId')
      .isUUID()
      .withMessage('Invalid property ID format'),
    
    body('photoIds')
      .isArray({ min: 1 })
      .withMessage('Photo IDs must be an array with at least one item'),
    
    body('photoIds.*')
      .isUUID()
      .withMessage('Each photo ID must be a valid UUID'),
    
    body('watermarkText')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Watermark text cannot exceed 100 characters'),
    
    body('position')
      .optional()
      .isIn(['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'])
      .withMessage('Invalid watermark position')
  ],

  validatePhotosSchema: [
    body('fileNames')
      .isArray({ min: 1, max: 20 })
      .withMessage('File names must be an array with 1-20 items'),
    
    body('fileNames.*')
      .isString()
      .withMessage('Each file name must be a string'),
    
    body('fileSizes')
      .isArray({ min: 1, max: 20 })
      .withMessage('File sizes must be an array with 1-20 items'),
    
    body('fileSizes.*')
      .isInt({ min: 1, max: 10485760 })
      .withMessage('Each file size must be between 1 byte and 10MB'),
    
    body('mimeTypes')
      .isArray({ min: 1, max: 20 })
      .withMessage('MIME types must be an array with 1-20 items'),
    
    body('mimeTypes.*')
      .isIn(['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
      .withMessage('Each MIME type must be JPEG, PNG, WEBP, or HEIC')
  ],

  searchPhotosSchema: [
    query('q')
      .notEmpty()
      .withMessage('Search query is required')
      .isLength({ min: 2 })
      .withMessage('Search query must be at least 2 characters'),
    
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ]
};

// Export individual schemas for direct imports
export const updatePhotoSchema = propertyPhotoValidation.updatePhotoSchema;
export const reorderPhotosSchema = propertyPhotoValidation.reorderPhotosSchema;
export const bulkDeleteSchema = propertyPhotoValidation.bulkDeleteSchema;
export const uploadPhotosSchema = propertyPhotoValidation.uploadPhotosSchema;
export const getUploadUrlSchema = propertyPhotoValidation.getUploadUrlSchema;
export const completeUploadSchema = propertyPhotoValidation.completeUploadSchema;
export const applyWatermarkSchema = propertyPhotoValidation.applyWatermarkSchema;
export const validatePhotosSchema = propertyPhotoValidation.validatePhotosSchema;
export const searchPhotosSchema = propertyPhotoValidation.searchPhotosSchema;

export default propertyPhotoValidation;