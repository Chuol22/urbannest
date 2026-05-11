import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import bookingValidation from '../validations/booking.validation.js';
import bookingController from '../controllers/booking.controller.js';

const router = express.Router();

const {
  createBookingSchema,
  updateBookingStatusSchema,
  cancelBookingSchema,
  addMessageSchema,
  getBookingsQuerySchema,
  bookingIdParamSchema,
  propertyIdParamSchema
} = bookingValidation;

// ==================== Protected Routes ====================

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 */
router.post('/',
  authMiddleware.verifyToken,
  validate(createBookingSchema),
  bookingController.createBooking
);

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Get user's bookings
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 */
router.get('/',
  authMiddleware.verifyToken,
  validate(getBookingsQuerySchema),
  bookingController.getUserBookings
);

/**
 * @swagger
 * /api/bookings/stats:
 *   get:
 *     summary: Get booking statistics
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats',
  authMiddleware.verifyToken,
  bookingController.getBookingStats
);

/**
 * @swagger
 * /api/bookings/property/{propertyId}:
 *   get:
 *     summary: Get bookings for a property (owner only)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 */
router.get('/property/:propertyId',
  authMiddleware.verifyToken,
  validate(propertyIdParamSchema),
  bookingController.getPropertyBookings
);

/**
 * @swagger
 * /api/bookings/reference/{reference}:
 *   get:
 *     summary: Get booking by reference number
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 */
router.get('/reference/:reference',
  authMiddleware.verifyToken,
  bookingController.getBookingByReference
);

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     summary: Get booking by ID
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id',
  authMiddleware.verifyToken,
  validate(bookingIdParamSchema),
  bookingController.getBookingById
);

/**
 * @swagger
 * /api/bookings/{id}/status:
 *   patch:
 *     summary: Update booking status
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id/status',
  authMiddleware.verifyToken,
  validate(updateBookingStatusSchema),
  bookingController.updateBookingStatus
);

/**
 * @swagger
 * /api/bookings/{id}/cancel:
 *   post:
 *     summary: Cancel booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/cancel',
  authMiddleware.verifyToken,
  validate(cancelBookingSchema),
  bookingController.cancelBooking
);

/**
 * @swagger
 * /api/bookings/{id}/messages:
 *   get:
 *     summary: Get booking messages
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id/messages',
  authMiddleware.verifyToken,
  validate(bookingIdParamSchema),
  bookingController.getBookingMessages
);

/**
 * @swagger
 * /api/bookings/{id}/messages:
 *   post:
 *     summary: Add message to booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/messages',
  authMiddleware.verifyToken,
  validate(addMessageSchema),
  bookingController.addBookingMessage
);

export default router;