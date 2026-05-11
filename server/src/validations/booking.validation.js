import { body, param, query } from 'express-validator';

const bookingValidation = {
  createBookingSchema: [
    body('propertyId')
      .notEmpty()
      .withMessage('Property ID is required')
      .isUUID()
      .withMessage('Invalid property ID format'),
    
    body('checkIn')
      .notEmpty()
      .withMessage('Check-in date is required')
      .isISO8601()
      .withMessage('Invalid date format')
      .custom((value, { req }) => {
        if (new Date(value) < new Date()) {
          throw new Error('Check-in date cannot be in the past');
        }
        return true;
      }),
    
    body('checkOut')
      .notEmpty()
      .withMessage('Check-out date is required')
      .isISO8601()
      .withMessage('Invalid date format')
      .custom((value, { req }) => {
        if (new Date(value) <= new Date(req.body.checkIn)) {
          throw new Error('Check-out date must be after check-in date');
        }
        return true;
      }),
    
    body('guests')
      .notEmpty()
      .withMessage('Number of guests is required')
      .isInt({ min: 1, max: 20 })
      .withMessage('Guests must be between 1 and 20'),
    
    body('totalPrice')
      .notEmpty()
      .withMessage('Total price is required')
      .isFloat({ min: 0 })
      .withMessage('Total price must be a positive number'),
    
    body('message')
      .optional()
      .isString()
      .withMessage('Message must be a string')
      .isLength({ max: 1000 })
      .withMessage('Message cannot exceed 1000 characters'),
    
    body('paymentMethod')
      .optional()
      .isIn(['BANK_TRANSFER', 'CREDIT_CARD', 'MOBILE_MONEY', 'DIGITAL_WALLET', 'CASH'])
      .withMessage('Invalid payment method')
  ],

  updateBookingStatusSchema: [
    param('id')
      .isUUID()
      .withMessage('Invalid booking ID format'),
    
    body('status')
      .notEmpty()
      .withMessage('Status is required')
      .isIn(['confirmed', 'rejected', 'completed', 'cancelled'])
      .withMessage('Invalid status'),
    
    body('reason')
      .optional()
      .isString()
      .withMessage('Reason must be a string')
      .isLength({ max: 500 })
      .withMessage('Reason cannot exceed 500 characters')
  ],

  cancelBookingSchema: [
    param('id')
      .isUUID()
      .withMessage('Invalid booking ID format'),
    
    body('reason')
      .optional()
      .isString()
      .withMessage('Reason must be a string')
      .isLength({ max: 500 })
      .withMessage('Reason cannot exceed 500 characters')
  ],

  addMessageSchema: [
    param('id')
      .isUUID()
      .withMessage('Invalid booking ID format'),
    
    body('message')
      .notEmpty()
      .withMessage('Message is required')
      .isString()
      .withMessage('Message must be a string')
      .isLength({ min: 1, max: 2000 })
      .withMessage('Message must be between 1 and 2000 characters')
  ],

  getBookingsQuerySchema: [
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
    
    query('status')
      .optional()
      .isIn(['pending', 'confirmed', 'rejected', 'completed', 'cancelled'])
      .withMessage('Invalid status'),
    
    query('type')
      .optional()
      .isIn(['as_host', 'as_seeker', 'all'])
      .withMessage('Invalid type')
  ],

  bookingIdParamSchema: [
    param('id')
      .isUUID()
      .withMessage('Invalid booking ID format')
  ],

  propertyIdParamSchema: [
    param('propertyId')
      .isUUID()
      .withMessage('Invalid property ID format')
  ]
};

export default bookingValidation;