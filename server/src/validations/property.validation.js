import { body, param, query } from 'express-validator';

// Create property validation schema
export const createPropertySchema = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 20, max: 5000 })
    .withMessage('Description must be between 20 and 5000 characters'),
  
  body('property_type')
    .notEmpty()
    .withMessage('Property type is required')
    .isIn(['apartment', 'house', 'condo', 'townhouse', 'land', 'commercial', 'studio'])
    .withMessage('Invalid property type'),
  
  body('purpose')
    .notEmpty()
    .withMessage('Purpose is required')
    .isIn(['rent', 'sale'])
    .withMessage('Purpose must be either rent or sale'),
  
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
    .isInt({ min: 0 })
    .withMessage('Bathrooms must be a positive integer'),
  
  body('area')
    .notEmpty()
    .withMessage('Area is required')
    .isFloat({ min: 0 })
    .withMessage('Area must be a positive number'),
  
  body('address')
    .notEmpty()
    .withMessage('Address is required')
    .isObject()
    .withMessage('Address must be an object'),
  
  body('address.street')
    .notEmpty()
    .withMessage('Street address is required'),
  
  body('address.city')
    .notEmpty()
    .withMessage('City is required'),
  
  body('address.state')
    .notEmpty()
    .withMessage('State is required'),
  
  body('address.country')
    .notEmpty()
    .withMessage('Country is required'),
  
  body('address.zip_code')
    .optional()
    .matches(/^[0-9]{5,10}$/)
    .withMessage('Invalid zip code format'),
  
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
    .optional()
    .isArray()
    .withMessage('Amenities must be an array'),
  
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  
  body('images.*.url')
    .optional()
    .isURL()
    .withMessage('Invalid image URL'),
  
  body('features')
    .optional()
    .isArray()
    .withMessage('Features must be an array'),
  
  body('status')
    .optional()
    .isIn(['available', 'pending', 'sold', 'rented', 'off_market'])
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
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  
  body('description')
    .optional()
    .isLength({ min: 20, max: 5000 })
    .withMessage('Description must be between 20 and 5000 characters'),
  
  body('property_type')
    .optional()
    .isIn(['apartment', 'house', 'condo', 'townhouse', 'land', 'commercial', 'studio'])
    .withMessage('Invalid property type'),
  
  body('listing_type')
    .optional()
    .isIn(['rent', 'sale'])
    .withMessage('Listing type must be either rent or sale'),
  
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
    .isInt({ min: 0 })
    .withMessage('Bathrooms must be a positive integer'),
  
  body('area')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Area must be a positive number'),
  
  body('address')
    .optional()
    .isObject()
    .withMessage('Address must be an object'),
  
  body('status')
    .optional()
    .isIn(['available', 'pending', 'sold', 'rented', 'off_market'])
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
    .isInt({ min: 0 })
    .withMessage('Bathrooms must be a positive integer')
    .toInt(),
  
  query('property_type')
    .optional()
    .isIn(['apartment', 'house', 'condo', 'townhouse', 'land', 'commercial', 'studio'])
    .withMessage('Invalid property type'),
  
  query('listing_type')
    .optional()
    .isIn(['rent', 'sale'])
    .withMessage('Listing type must be either rent or sale'),
  
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