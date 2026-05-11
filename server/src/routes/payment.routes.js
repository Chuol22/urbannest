import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import paymentValidation from "../validations/payment.validation.js";

// Import payment controller methods
import {
  initializePayment,
  getUserTransactions,
  getTransactionStats,
  getPaymentMethods,
  addPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  setDefaultMethod,
  verifyPaymentMethod,
  handleWebhook,
  getTransaction,
  confirmPayment,
  cancelPayment,
  processRefund,
  getReceipt,
  downloadReceipt,
  emailReceipt,
  checkPaymentStatus,
  getTransactionByReference,
  getBookingTransactions,
  getPropertyTransactions,
  getPaymentSummary,
  calculatePayment,
  verifyPayment,
  getAvailableGateways,
  getSupportedCurrencies,
  getExchangeRate,
  bulkUpdateStatus,
  exportTransactions,
  runReconciliation,
  getPlatformFees
} from "../controllers/payment.controller.js";

const router = express.Router();

const {
  initializePaymentSchema,
  confirmPaymentSchema,
  processRefundSchema,
  addPaymentMethodSchema,
  updatePaymentMethodSchema
} = paymentValidation;

// ==================== Public Routes ====================

/**
 * @swagger
 * /api/payments/gateways:
 *   get:
 *     summary: Get available payment gateways
 *     tags: [Payments]
 */
router.get('/gateways', getAvailableGateways);

/**
 * @swagger
 * /api/payments/currencies:
 *   get:
 *     summary: Get supported currencies
 *     tags: [Payments]
 */
router.get('/currencies', getSupportedCurrencies);

/**
 * @swagger
 * /api/payments/exchange-rate:
 *   get:
 *     summary: Get current exchange rate
 *     tags: [Payments]
 */
router.get('/exchange-rate', getExchangeRate);

/**
 * @swagger
 * /api/payments/fees:
 *   get:
 *     summary: Get platform fees
 *     tags: [Payments]
 */
router.get('/fees', getPlatformFees);

/**
 * @swagger
 * /api/payments/webhook/{gateway}:
 *   post:
 *     summary: Webhook handler for payment gateways
 *     tags: [Payments]
 */
router.post('/webhook/:gateway', handleWebhook);

// ==================== Protected Routes ====================

/**
 * @swagger
 * /api/payments/initialize:
 *   post:
 *     summary: Initialize a new payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.post('/initialize',
  authMiddleware.verifyToken,
  validate(initializePaymentSchema),
  initializePayment
);

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Get user transactions
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.get('/',
  authMiddleware.verifyToken,
  getUserTransactions
);

/**
 * @swagger
 * /api/payments/stats:
 *   get:
 *     summary: Get transaction statistics (admin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats',
  authMiddleware.verifyToken,
  authMiddleware.checkRole(['admin']),
  getTransactionStats
);

/**
 * @swagger
 * /api/payments/summary:
 *   get:
 *     summary: Get payment summary for current user
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.get('/summary',
  authMiddleware.verifyToken,
  getPaymentSummary
);

/**
 * @swagger
 * /api/payments/calculate:
 *   post:
 *     summary: Calculate payment amount
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.post('/calculate',
  authMiddleware.verifyToken,
  calculatePayment
);

/**
 * @swagger
 * /api/payments/verify:
 *   post:
 *     summary: Verify payment without processing
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.post('/verify',
  authMiddleware.verifyToken,
  verifyPayment
);

/**
 * @swagger
 * /api/payments/methods:
 *   get:
 *     summary: Get user's payment methods
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.get('/methods',
  authMiddleware.verifyToken,
  getPaymentMethods
);

/**
 * @swagger
 * /api/payments/methods:
 *   post:
 *     summary: Add a new payment method
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.post('/methods',
  authMiddleware.verifyToken,
  validate(addPaymentMethodSchema),
  addPaymentMethod
);

/**
 * @swagger
 * /api/payments/methods/{id}:
 *   patch:
 *     summary: Update payment method
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/methods/:id',
  authMiddleware.verifyToken,
  validate(updatePaymentMethodSchema),
  updatePaymentMethod
);

/**
 * @swagger
 * /api/payments/methods/{id}:
 *   delete:
 *     summary: Delete payment method
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/methods/:id',
  authMiddleware.verifyToken,
  deletePaymentMethod
);

/**
 * @swagger
 * /api/payments/methods/{id}/default:
 *   patch:
 *     summary: Set payment method as default
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/methods/:id/default',
  authMiddleware.verifyToken,
  setDefaultMethod
);

/**
 * @swagger
 * /api/payments/methods/{id}/verify:
 *   post:
 *     summary: Verify payment method
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.post('/methods/:id/verify',
  authMiddleware.verifyToken,
  verifyPaymentMethod
);

// ==================== Transaction Routes ====================

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Get transaction by ID
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id',
  authMiddleware.verifyToken,
  getTransaction
);

/**
 * @swagger
 * /api/payments/{id}/confirm:
 *   post:
 *     summary: Confirm payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/confirm',
  authMiddleware.verifyToken,
  validate(confirmPaymentSchema),
  confirmPayment
);

/**
 * @swagger
 * /api/payments/{id}/cancel:
 *   post:
 *     summary: Cancel pending payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/cancel',
  authMiddleware.verifyToken,
  cancelPayment
);

/**
 * @swagger
 * /api/payments/{id}/refund:
 *   post:
 *     summary: Process refund
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/refund',
  authMiddleware.verifyToken,
  validate(processRefundSchema),
  processRefund
);

/**
 * @swagger
 * /api/payments/{id}/receipt:
 *   get:
 *     summary: Get payment receipt
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id/receipt',
  authMiddleware.verifyToken,
  getReceipt
);

/**
 * @swagger
 * /api/payments/{id}/receipt/download:
 *   get:
 *     summary: Download payment receipt
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id/receipt/download',
  authMiddleware.verifyToken,
  downloadReceipt
);

/**
 * @swagger
 * /api/payments/{id}/receipt/email:
 *   post:
 *     summary: Email payment receipt
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/receipt/email',
  authMiddleware.verifyToken,
  emailReceipt
);

/**
 * @swagger
 * /api/payments/{id}/status:
 *   get:
 *     summary: Check payment status
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id/status',
  authMiddleware.verifyToken,
  checkPaymentStatus
);

/**
 * @swagger
 * /api/payments/by-reference/{reference}:
 *   get:
 *     summary: Get transaction by reference number
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.get('/by-reference/:reference',
  authMiddleware.verifyToken,
  getTransactionByReference
);

/**
 * @swagger
 * /api/payments/booking/{bookingId}:
 *   get:
 *     summary: Get transactions for a booking
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.get('/booking/:bookingId',
  authMiddleware.verifyToken,
  getBookingTransactions
);

/**
 * @swagger
 * /api/payments/property/{propertyId}:
 *   get:
 *     summary: Get transactions for a property
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.get('/property/:propertyId',
  authMiddleware.verifyToken,
  getPropertyTransactions
);

// ==================== Admin Only Routes ====================

/**
 * @swagger
 * /api/payments/bulk/status:
 *   patch:
 *     summary: Bulk update transaction status (admin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/bulk/status',
  authMiddleware.verifyToken,
  authMiddleware.checkRole(['admin']),
  bulkUpdateStatus
);

/**
 * @swagger
 * /api/payments/export:
 *   get:
 *     summary: Export transactions (admin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.get('/export',
  authMiddleware.verifyToken,
  authMiddleware.checkRole(['admin']),
  exportTransactions
);

/**
 * @swagger
 * /api/payments/reconciliation:
 *   post:
 *     summary: Run payment reconciliation (admin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.post('/reconciliation',
  authMiddleware.verifyToken,
  authMiddleware.checkRole(['admin']),
  runReconciliation
);

export default router;