import { body, param, query } from 'express-validator';

const favoriteValidation = {
  addFavoriteSchema: [
    body('propertyId')
      .isUUID()
      .withMessage('Invalid property ID format'),
    
    body('favoriteType')
      .optional()
      .isIn(['WISHLIST', 'FAVORITE', 'SHORTLIST', 'COMPARE', 'FOLLOW'])
      .withMessage('Invalid favorite type'),
    
    body('notifyOnPriceChange')
      .optional()
      .isBoolean()
      .withMessage('notifyOnPriceChange must be a boolean'),
    
    body('notifyOnStatusChange')
      .optional()
      .isBoolean()
      .withMessage('notifyOnStatusChange must be a boolean'),
    
    body('notifyOnNewPhotos')
      .optional()
      .isBoolean()
      .withMessage('notifyOnNewPhotos must be a boolean'),
    
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    
    body('tags.*')
      .optional()
      .isString()
      .withMessage('Each tag must be a string')
      .isLength({ max: 50 })
      .withMessage('Each tag cannot exceed 50 characters')
      .trim()
      .escape(),
    
    body('priority')
      .optional()
      .isInt({ min: 0, max: 10 })
      .withMessage('Priority must be between 0 and 10')
  ],

  updateFavoriteSchema: [
    param('id')
      .isUUID()
      .withMessage('Invalid favorite ID format'),
    
    body('favoriteType')
      .optional()
      .isIn(['WISHLIST', 'FAVORITE', 'SHORTLIST', 'COMPARE', 'FOLLOW'])
      .withMessage('Invalid favorite type'),
    
    body('notifyOnPriceChange')
      .optional()
      .isBoolean()
      .withMessage('notifyOnPriceChange must be a boolean'),
    
    body('notifyOnStatusChange')
      .optional()
      .isBoolean()
      .withMessage('notifyOnStatusChange must be a boolean'),
    
    body('notifyOnNewPhotos')
      .optional()
      .isBoolean()
      .withMessage('notifyOnNewPhotos must be a boolean'),
    
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    
    body('tags.*')
      .optional()
      .isString()
      .withMessage('Each tag must be a string')
      .isLength({ max: 50 })
      .withMessage('Each tag cannot exceed 50 characters'),
    
    body('priority')
      .optional()
      .isInt({ min: 0, max: 10 })
      .withMessage('Priority must be between 0 and 10'),
    
    body('expiresAt')
      .optional()
      .isISO8601()
      .withMessage('Invalid expiration date format')
      .custom((value) => {
        if (new Date(value) < new Date()) {
          throw new Error('Expiration date must be in the future');
        }
        return true;
      })
  ],

  bulkRemoveSchema: [
    body('propertyIds')
      .isArray({ min: 1 })
      .withMessage('Property IDs must be an array with at least one item'),
    
    body('propertyIds.*')
      .isUUID()
      .withMessage('Each property ID must be a valid UUID')
  ],

  addTagsSchema: [
    param('id')
      .isUUID()
      .withMessage('Invalid favorite ID format'),
    
    body('tags')
      .isArray({ min: 1 })
      .withMessage('Tags must be an array with at least one item'),
    
    body('tags.*')
      .isString()
      .withMessage('Each tag must be a string')
      .isLength({ min: 1, max: 50 })
      .withMessage('Each tag must be between 1 and 50 characters')
      .trim()
      .escape()
  ],

  updatePrioritySchema: [
    param('id')
      .isUUID()
      .withMessage('Invalid favorite ID format'),
    
    body('priority')
      .notEmpty()
      .withMessage('Priority is required')
      .isInt({ min: 0, max: 10 })
      .withMessage('Priority must be between 0 and 10')
  ],

  extendExpirationSchema: [
    param('id')
      .isUUID()
      .withMessage('Invalid favorite ID format'),
    
    body('months')
      .notEmpty()
      .withMessage('Months are required')
      .isInt({ min: 1, max: 12 })
      .withMessage('Months must be between 1 and 12')
  ],

  getFavoritesQuerySchema: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('favoriteType')
      .optional()
      .isIn(['WISHLIST', 'FAVORITE', 'SHORTLIST', 'COMPARE', 'FOLLOW'])
      .withMessage('Invalid favorite type'),
    
    query('tag')
      .optional()
      .isString()
      .withMessage('Tag must be a string')
      .isLength({ max: 50 })
      .withMessage('Tag cannot exceed 50 characters'),
    
    query('sort')
      .optional()
      .isIn(['newest', 'oldest', 'price_asc', 'price_desc', 'priority', 'expiring'])
      .withMessage('Invalid sort option'),
    
    query('includeExpired')
      .optional()
      .isBoolean()
      .withMessage('includeExpired must be a boolean')
  ],

  compareFavoritesSchema: [
    body('propertyIds')
      .isArray({ min: 2, max: 5 })
      .withMessage('Property IDs must be an array with 2-5 items'),
    
    body('propertyIds.*')
      .isUUID()
      .withMessage('Each property ID must be a valid UUID')
  ]
};

// Export individual schemas for direct imports
export const addFavoriteSchema = favoriteValidation.addFavoriteSchema;
export const updateFavoriteSchema = favoriteValidation.updateFavoriteSchema;
export const bulkRemoveSchema = favoriteValidation.bulkRemoveSchema;
export const addTagsSchema = favoriteValidation.addTagsSchema;
export const updatePrioritySchema = favoriteValidation.updatePrioritySchema;
export const extendExpirationSchema = favoriteValidation.extendExpirationSchema;
export const getFavoritesQuerySchema = favoriteValidation.getFavoritesQuerySchema;
export const compareFavoritesSchema = favoriteValidation.compareFavoritesSchema;

export default favoriteValidation;