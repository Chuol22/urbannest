import { body, param } from 'express-validator';

const reviewValidation = {
  createReviewSchema: [
    body('type')
      .notEmpty()
      .withMessage('Review type is required')
      .isIn(['PROPERTY', 'OWNER', 'CUSTOMER', 'AGENCY'])
      .withMessage('Invalid review type'),
    
    body('rating')
      .notEmpty()
      .withMessage('Rating is required')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    
    body('title')
      .optional()
      .isLength({ max: 200 })
      .withMessage('Title cannot exceed 200 characters'),
    
    body('content')
      .notEmpty()
      .withMessage('Content is required')
      .isLength({ min: 3, max: 1000 })
      .withMessage('Content must be between 3 and 1000 characters'),
    
    body('pros')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Pros cannot exceed 500 characters'),
    
    body('cons')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Cons cannot exceed 500 characters'),
    
    body('propertyId')
      .optional()
      .isUUID()
      .withMessage('Invalid property ID format'),
    
    body('ownerId')
      .optional()
      .isUUID()
      .withMessage('Invalid owner ID format'),
    
    body('customerId')
      .optional()
      .isUUID()
      .withMessage('Invalid customer ID format'),
    
    body('bookingId')
      .optional()
      .isUUID()
      .withMessage('Invalid booking ID format'),
    
    body('transactionId')
      .optional()
      .isUUID()
      .withMessage('Invalid transaction ID format'),
    
    body('accuracyRating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Accuracy rating must be between 1 and 5'),
    
    body('communicationRating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Communication rating must be between 1 and 5'),
    
    body('cleanlinessRating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Cleanliness rating must be between 1 and 5'),
    
    body('locationRating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Location rating must be between 1 and 5'),
    
    body('valueRating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Value rating must be between 1 and 5'),
    
    body('amenitiesRating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Amenities rating must be between 1 and 5'),
    
    body('responsivenessRating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Responsiveness rating must be between 1 and 5'),
    
    body('fairnessRating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Fairness rating must be between 1 and 5'),
    
    body('maintenanceRating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Maintenance rating must be between 1 and 5'),
    
    body('paymentReliability')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Payment reliability must be between 1 and 5'),
    
    body('careOfProperty')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Care of property must be between 1 and 5'),
    
    body('noiseLevel')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Noise level must be between 1 and 5')
  ],

  updateReviewSchema: [
    body('rating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    
    body('title')
      .optional()
      .isLength({ max: 200 })
      .withMessage('Title cannot exceed 200 characters'),
    
    body('content')
      .optional()
      .isLength({ min: 3, max: 1000 })
      .withMessage('Content must be between 3 and 1000 characters'),
    
    body('pros')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Pros cannot exceed 500 characters'),
    
    body('cons')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Cons cannot exceed 500 characters'),
    
    body('accuracyRating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Accuracy rating must be between 1 and 5'),
    
    body('communicationRating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Communication rating must be between 1 and 5'),
    
    body('cleanlinessRating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Cleanliness rating must be between 1 and 5'),
    
    body('locationRating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Location rating must be between 1 and 5'),
    
    body('valueRating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Value rating must be between 1 and 5')
  ],

  reportReviewSchema: [
    param('id')
      .isUUID()
      .withMessage('Invalid review ID format'),
    
    body('reason')
      .notEmpty()
      .withMessage('Reason is required')
      .isIn(['spam', 'inappropriate', 'fake', 'hateful', 'other'])
      .withMessage('Invalid reason'),
    
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters')
  ],

  moderateReviewSchema: [
    param('id')
      .isUUID()
      .withMessage('Invalid review ID format'),
    
    body('status')
      .notEmpty()
      .withMessage('Status is required')
      .isIn(['PUBLISHED', 'REMOVED', 'SPAM'])
      .withMessage('Invalid status'),
    
    body('moderationNote')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Moderation note cannot exceed 500 characters')
  ],

  addResponseSchema: [
    param('id')
      .isUUID()
      .withMessage('Invalid review ID format'),
    
    body('content')
      .notEmpty()
      .withMessage('Content is required')
      .isLength({ min: 3, max: 1000 })
      .withMessage('Content must be between 3 and 1000 characters'),
    
    body('isOfficial')
      .optional()
      .isBoolean()
      .withMessage('isOfficial must be a boolean')
  ]
};

// Export individual schemas for direct import
export const createReviewSchema = reviewValidation.createReviewSchema;
export const updateReviewSchema = reviewValidation.updateReviewSchema;
export const reportReviewSchema = reviewValidation.reportReviewSchema;
export const moderateReviewSchema = reviewValidation.moderateReviewSchema;
export const addResponseSchema = reviewValidation.addResponseSchema;

export default reviewValidation;