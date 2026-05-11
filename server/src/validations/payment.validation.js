import { body, param, query } from 'express-validator';

const paymentValidation = {
  initializePaymentSchema: [
    body('type')
      .notEmpty()
      .withMessage('Payment type is required')
      .isIn(['RENT_PAYMENT', 'SECURITY_DEPOSIT', 'DEPOSIT_REFUND', 'BUYER_PAYMENT', 'SELLER_RECEIPT'])
      .withMessage('Invalid payment type'),
    
    body('amount')
      .notEmpty()
      .withMessage('Amount is required')
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be greater than 0'),
    
    body('currency')
      .optional()
      .isIn(['ETB', 'KES', 'UGX', 'SOS', 'NGN', 'USD', 'SSP', 'SDG'])
      .withMessage('Invalid currency'),
    
    body('paymentMethod')
      .notEmpty()
      .withMessage('Payment method is required')
      .isIn(['BANK_TRANSFER', 'CREDIT_CARD', 'MOBILE_MONEY', 'DIGITAL_WALLET', 'CASH'])
      .withMessage('Invalid payment method'),
    
    body('paymentGateway')
      .notEmpty()
      .withMessage('Payment gateway is required')
      .isIn(['CBE_BIRR', 'TELEBIRR', 'M_PESA', 'COMMERCE_BANK', 'CHAPA', 'STRIPE'])
      .withMessage('Invalid payment gateway'),
    
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters')
      .trim()
      .escape(),
    
    body('propertyId')
      .optional()
      .custom((value, { req }) => {
        if (req.body.type === 'SECURITY_DEPOSIT' && !value) {
          throw new Error('Property ID is required for security deposits');
        }
        return true;
      })
      .isUUID()
      .withMessage('Invalid property ID format'),
    
    body('bookingId')
      .optional()
      .custom((value, { req }) => {
        if (req.body.type === 'RENT_PAYMENT' && !value) {
          throw new Error('Booking ID is required for rent payments');
        }
        return true;
      })
      .isUUID()
      .withMessage('Invalid booking ID format'),
    
    body('isProrated')
      .optional()
      .isBoolean()
      .withMessage('isProrated must be a boolean'),
    
    body('proratedDays')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Prorated days must be between 1 and 365'),
    
    body('periodStart')
      .optional()
      .isISO8601()
      .withMessage('Invalid period start date format'),
    
    body('periodEnd')
      .optional()
      .isISO8601()
      .withMessage('Invalid period end date format')
      .custom((value, { req }) => {
        if (req.body.periodStart && new Date(value) <= new Date(req.body.periodStart)) {
          throw new Error('Period end must be after period start');
        }
        return true;
      }),
    
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata must be an object')
  ],

  confirmPaymentSchema: [
    param('id')
      .isUUID()
      .withMessage('Invalid transaction ID format'),
    
    body('paymentIntentId')
      .optional()
      .isString()
      .withMessage('Payment intent ID must be a string'),
    
    body('gatewayResponse')
      .optional()
      .isObject()
      .withMessage('Gateway response must be an object')
  ],

  processRefundSchema: [
    param('id')
      .isUUID()
      .withMessage('Invalid transaction ID format'),
    
    body('amount')
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage('Refund amount must be greater than 0')
      .custom((value, { req }) => {
        if (value > req.transaction?.amount) {
          throw new Error('Refund amount cannot exceed original amount');
        }
        return true;
      }),
    
    body('reason')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Reason cannot exceed 500 characters')
      .trim()
      .escape()
  ],

  addPaymentMethodSchema: [
    body('paymentMethod')
      .notEmpty()
      .withMessage('Payment method is required')
      .isIn(['BANK_TRANSFER', 'CREDIT_CARD', 'MOBILE_MONEY', 'DIGITAL_WALLET'])
      .withMessage('Invalid payment method'),
    
    body('paymentGateway')
      .notEmpty()
      .withMessage('Payment gateway is required')
      .isIn(['CBE_BIRR', 'TELEBIRR', 'M_PESA', 'COMMERCE_BANK', 'CHAPA', 'STRIPE'])
      .withMessage('Invalid payment gateway'),
    
    body('gatewayCustomerId')
      .optional()
      .isString()
      .withMessage('Gateway customer ID must be a string'),
    
    body('gatewayPaymentMethodId')
      .optional()
      .isString()
      .withMessage('Gateway payment method ID must be a string'),
    
    body('lastFour')
      .optional()
      .isString()
      .withMessage('Last four must be a string')
      .isLength({ min: 4, max: 4 })
      .withMessage('Last four must be exactly 4 characters')
      .isNumeric()
      .withMessage('Last four must contain only numbers'),
    
    body('cardBrand')
      .optional()
      .isIn(['Visa', 'Mastercard', 'Amex', 'Discover'])
      .withMessage('Invalid card brand'),
    
    body('expiryMonth')
      .optional()
      .isInt({ min: 1, max: 12 })
      .withMessage('Expiry month must be between 1 and 12'),
    
    body('expiryYear')
      .optional()
      .isInt({ min: new Date().getFullYear() })
      .withMessage('Expiry year must be current or future year'),
    
    body('cardholderName')
      .optional()
      .isString()
      .withMessage('Cardholder name must be a string')
      .isLength({ max: 100 })
      .withMessage('Cardholder name cannot exceed 100 characters'),
    
    body('bankName')
      .optional()
      .isString()
      .withMessage('Bank name must be a string')
      .isLength({ max: 100 })
      .withMessage('Bank name cannot exceed 100 characters'),
    
    body('accountType')
      .optional()
      .isIn(['checking', 'savings'])
      .withMessage('Account type must be checking or savings'),
    
    body('billingAddress1')
      .optional()
      .isString()
      .withMessage('Billing address must be a string')
      .isLength({ max: 255 })
      .withMessage('Billing address cannot exceed 255 characters'),
    
    body('billingCity')
      .optional()
      .isString()
      .withMessage('Billing city must be a string')
      .isLength({ max: 100 })
      .withMessage('Billing city cannot exceed 100 characters'),
    
    body('billingState')
      .optional()
      .isString()
      .withMessage('Billing state must be a string')
      .isLength({ max: 100 })
      .withMessage('Billing state cannot exceed 100 characters'),
    
    body('billingCountry')
      .optional()
      .isString()
      .withMessage('Billing country must be a string')
      .isLength({ min: 2, max: 2 })
      .withMessage('Billing country must be a 2-letter country code'),
    
    body('isDefault')
      .optional()
      .isBoolean()
      .withMessage('isDefault must be a boolean')
  ],

  updatePaymentMethodSchema: [
    param('id')
      .isUUID()
      .withMessage('Invalid payment method ID format'),
    
    body('isDefault')
      .optional()
      .isBoolean()
      .withMessage('isDefault must be a boolean'),
    
    body('billingAddress1')
      .optional()
      .isString()
      .withMessage('Billing address must be a string')
      .isLength({ max: 255 })
      .withMessage('Billing address cannot exceed 255 characters'),
    
    body('billingAddress2')
      .optional()
      .isString()
      .withMessage('Billing address must be a string')
      .isLength({ max: 255 })
      .withMessage('Billing address cannot exceed 255 characters'),
    
    body('billingCity')
      .optional()
      .isString()
      .withMessage('Billing city must be a string')
      .isLength({ max: 100 })
      .withMessage('Billing city cannot exceed 100 characters'),
    
    body('billingState')
      .optional()
      .isString()
      .withMessage('Billing state must be a string')
      .isLength({ max: 100 })
      .withMessage('Billing state cannot exceed 100 characters'),
    
    body('billingCountry')
      .optional()
      .isString()
      .withMessage('Billing country must be a string')
      .isLength({ min: 2, max: 2 })
      .withMessage('Billing country must be a 2-letter country code')
  ],

  verifyPaymentMethodSchema: [
    param('id')
      .isUUID()
      .withMessage('Invalid payment method ID format'),
    
    body('verificationCode')
      .optional()
      .isString()
      .withMessage('Verification code must be a string')
      .isLength({ min: 4, max: 6 })
      .withMessage('Verification code must be 4-6 characters')
  ],

  getTransactionsQuerySchema: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('type')
      .optional()
      .isIn(['RENT_PAYMENT', 'SECURITY_DEPOSIT', 'DEPOSIT_REFUND', 'BUYER_PAYMENT', 'SELLER_RECEIPT'])
      .withMessage('Invalid transaction type'),
    
    query('status')
      .optional()
      .isIn(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED'])
      .withMessage('Invalid transaction status'),
    
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid start date format'),
    
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid end date format')
      .custom((value, { req }) => {
        if (req.query.startDate && new Date(value) < new Date(req.query.startDate)) {
          throw new Error('End date must be after start date');
        }
        return true;
      }),
    
    query('sort')
      .optional()
      .isIn(['newest', 'oldest', 'amount_desc', 'amount_asc'])
      .withMessage('Invalid sort option')
  ],

  calculatePaymentSchema: [
    body('type')
      .notEmpty()
      .withMessage('Payment type is required')
      .isIn(['RENT_PAYMENT', 'SECURITY_DEPOSIT'])
      .withMessage('Invalid payment type for calculation'),
    
    body('baseAmount')
      .notEmpty()
      .withMessage('Base amount is required')
      .isFloat({ min: 0.01 })
      .withMessage('Base amount must be greater than 0'),
    
    body('startDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid start date format'),
    
    body('endDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid end date format')
      .custom((value, { req }) => {
        if (req.body.startDate && new Date(value) <= new Date(req.body.startDate)) {
          throw new Error('End date must be after start date');
        }
        return true;
      }),
    
    body('propertyId')
      .optional()
      .isUUID()
      .withMessage('Invalid property ID format')
  ],

  verifyPaymentSchema: [
    body('gatewayTransactionId')
      .notEmpty()
      .withMessage('Gateway transaction ID is required')
      .isString()
      .withMessage('Gateway transaction ID must be a string'),
    
    body('paymentGateway')
      .notEmpty()
      .withMessage('Payment gateway is required')
      .isIn(['CBE_BIRR', 'TELEBIRR', 'M_PESA', 'COMMERCE_BANK', 'CHAPA', 'STRIPE'])
      .withMessage('Invalid payment gateway'),
    
    body('amount')
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be greater than 0'),
    
    body('currency')
      .optional()
      .isIn(['ETB', 'KES', 'UGX', 'SOS', 'NGN', 'USD', 'SSP', 'SDG'])
      .withMessage('Invalid currency')
  ],

  getExchangeRateSchema: [
    query('from')
      .notEmpty()
      .withMessage('From currency is required')
      .isIn(['ETB', 'KES', 'UGX', 'SOS', 'NGN', 'USD', 'SSP', 'SDG'])
      .withMessage('Invalid from currency'),
    
    query('to')
      .notEmpty()
      .withMessage('To currency is required')
      .isIn(['ETB', 'KES', 'UGX', 'SOS', 'NGN', 'USD', 'SSP', 'SDG'])
      .withMessage('Invalid to currency')
  ],

  bulkUpdateStatusSchema: [
    body('transactionIds')
      .isArray({ min: 1 })
      .withMessage('Transaction IDs must be an array with at least one item'),
    
    body('transactionIds.*')
      .isUUID()
      .withMessage('Each transaction ID must be a valid UUID'),
    
    body('status')
      .notEmpty()
      .withMessage('Status is required')
      .isIn(['COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED'])
      .withMessage('Invalid status'),
    
    body('reason')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Reason cannot exceed 500 characters')
  ],

  emailReceiptSchema: [
    param('id')
      .isUUID()
      .withMessage('Invalid transaction ID format'),
    
    body('email')
      .optional()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail()
  ]
};

export default paymentValidation;