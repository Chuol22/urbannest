import { body, param, query } from 'express-validator';

const VALID_PROPERTY_TYPES = [
  'apartment', 'house', 'office', 'land', 'warehouse',
  'hotel', 'restaurant_space', 'shop_space', 'shopping_mall_space',
  'factory_space', 'condo', 'townhouse', 'commercial', 'studio', 'other'
];

const VALID_PURPOSES = [
  'sale', 'rent', 'lease', 'short_term_rental', 'long_term_rental', 'other'
];

// Create property validation schema
export const createPropertySchema = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 5, max: 5000 })
    .withMessage('Description must be between 5 and 5000 characters'),
  
  body('property_type')
    .notEmpty()
    .withMessage('Property type is required')
    .isIn(VALID_PROPERTY_TYPES)
    .withMessage('Invalid property type'),
  
  body('purpose')
    .notEmpty()
    .withMessage('Purpose is required')
    .isIn(VALID_PURPOSES)
    .withMessage('Invalid property purpose'),
  
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('bedrooms')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Bedrooms must be a positive integer'),
  
  body('bathrooms')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Bathrooms must be a positive number'),

  body('sitting_area')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sitting area must be a positive integer'),

  body('kitchen')
    .optional(),

  body('currency')
    .optional()
    .isIn(['ETB', 'KES', 'UGX', 'SOS', 'NGN', 'USD', 'SSP', 'SDG', 'etc'])
    .withMessage('Invalid currency'),
  
  body('area')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Area must be a positive number'),
  
  body('locationId')
    .optional({ nullable: true, checkFalsy: true })
    .isUUID()
    .withMessage('Invalid location ID format'),

  body('location')
    .optional()
    .isObject()
    .withMessage('Location must be an object'),

  body('address')
    .optional(),
  
  body('coordinates')
    .optional()
    .isObject()
    .withMessage('Coordinates must be an object'),
  
  body('coordinates.lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
  
  body('coordinates.lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),
  
  body('amenities')
    .optional(),
  
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  
  body('features')
    .optional()
    .isArray()
    .withMessage('Features must be an array'),
  
  body('status')
    .optional()
    .isIn(['available', 'pending', 'sold', 'rented', 'off_market', 'coming_soon', 'price_reduced', 'withdrawn', 'leased'])
    .withMessage('Invalid property status'),
  
  body('availability_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  
  body('is_featured')
    .optional()
    .isBoolean()
    .withMessage('is_featured must be a boolean')
];

// Update property validation schema
export const updatePropertySchema = [
  param('id')
    .isUUID()
    .withMessage('Invalid property ID format'),
  
  body('title')
    .optional()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  
  body('description')
    .optional()
    .isLength({ min: 5, max: 5000 })
    .withMessage('Description must be between 5 and 5000 characters'),
  
  body('property_type')
    .optional()
    .isIn(VALID_PROPERTY_TYPES)
    .withMessage('Invalid property type'),
  
  body('purpose')
    .optional()
    .isIn(VALID_PURPOSES)
    .withMessage('Invalid property purpose'),

  body('listing_type')
    .optional()
    .isIn(VALID_PURPOSES)
    .withMessage('Listing type must be a valid purpose'),
  
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('bedrooms')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Bedrooms must be a positive integer'),
  
  body('bathrooms')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Bathrooms must be a positive number'),

  body('sitting_area')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sitting area must be a positive integer'),
  
  body('area')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Area must be a positive number'),
  
  body('address')
    .optional(),

  body('location')
    .optional()
    .isObject()
    .withMessage('Location must be an object'),
  
  body('status')
    .optional()
    .isIn(['available', 'pending', 'sold', 'rented', 'off_market', 'coming_soon', 'price_reduced', 'withdrawn', 'leased'])
    .withMessage('Invalid property status'),
  
  body('is_featured')
    .optional()
    .isBoolean()
    .withMessage('is_featured must be a boolean')
];

// Get properties query validation
export const getPropertiesQuerySchema = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  query('min_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number')
    .toFloat(),
  
  query('max_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number')
    .toFloat(),
  
  query('min_area')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum area must be a positive number')
    .toFloat(),
  
  query('max_area')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum area must be a positive number')
    .toFloat(),
  
  query('bedrooms')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Bedrooms must be a positive integer')
    .toInt(),
  
  query('bathrooms')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Bathrooms must be a positive number')
    .toFloat(),
  
  query('property_type')
    .optional()
    .isIn(VALID_PROPERTY_TYPES)
    .withMessage('Invalid property type'),
  
  query('purpose')
    .optional()
    .isIn(VALID_PURPOSES)
    .withMessage('Invalid purpose'),

  query('listing_type')
    .optional()
    .isIn(VALID_PURPOSES)
    .withMessage('Listing type must be a valid purpose'),
  
  query('city')
    .optional()
    .isString()
    .withMessage('City must be a string'),
  
  query('state')
    .optional()
    .isString()
    .withMessage('State must be a string'),
  
  query('sort_by')
    .optional()
    .isIn(['price', 'created_at', 'area', 'bedrooms'])
    .withMessage('Invalid sort field'),
  
  query('sort_order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  
  query('amenities')
    .optional()
    .isString()
    .withMessage('Amenities must be a string')
];

// Property ID param validation
export const propertyIdParamSchema = [
  param('id')
    .isUUID()
    .withMessage('Invalid property ID format')
];

// Get property by ID validation (same as above)
export const getPropertyByIdSchema = propertyIdParamSchema;

// Delete property validation
export const deletePropertySchema = propertyIdParamSchema;

// Add to favorites validation
export const addToFavoritesSchema = [
  param('propertyId')
    .isUUID()
    .withMessage('Invalid property ID format')
];

// Remove from favorites validation
export const removeFromFavoritesSchema = [
  param('propertyId')
    .isUUID()
    .withMessage('Invalid property ID format')
];

// Search properties validation
export const searchPropertiesSchema = [
  query('q')
    .optional()
    .isString()
    .withMessage('Search query must be a string')
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
];

// Export all schemas
export default {
  createPropertySchema,
  updatePropertySchema,
  getPropertiesQuerySchema,
  propertyIdParamSchema,
  getPropertyByIdSchema,
  deletePropertySchema,
  addToFavoritesSchema,
  removeFromFavoritesSchema,
  searchPropertiesSchema
};