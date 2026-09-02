/**
 * Chapa Payment Service
 *
 * Handles all interactions with the Chapa payment gateway API.
 * Provides methods for initializing and verifying payments.
 *
 * @see https://developer.chapa.co/
 * @author UrbanNEST Team
 * @version 2.0.0
 */

import axios from 'axios';
import crypto from 'crypto';

/* ==========================================================================
   Chapa Service Class
   ========================================================================== */

class ChapaService {
  constructor() {
    this.secretKey = process.env.CHAPA_SECRET_KEY || 'CHASECK_TEST-f1spSv89Gl5KyQHfhVsr62XadDMMhouO';
    this.baseURL = process.env.CHAPA_BASE_URL || 'https://api.chapa.co/v1';

    if (!process.env.CHAPA_SECRET_KEY) {
      console.warn('⚠️ CHAPA_SECRET_KEY not set in environment variables, using fallback test key');
    }
  }

  /* ==========================================================================
     Payment Verification
     ========================================================================== */

  /**
   * Verify a payment transaction with Chapa.
   *
   * @param {string} transactionReference - The transaction reference (tx_ref)
   * @returns {Promise<Object>} Verification result containing:
   *   - success: boolean indicating if verification succeeded
   *   - data: Chapa response data
   *   - message: Status message
   *
   * @example
   * const result = await chapaService.verifyPayment('tx-ref-123');
   * if (result.success) {
   *   console.log('Payment confirmed:', result.data);
   * }
   */
  async verifyPayment(transactionReference) {
    try {
      console.log(`🔍 Verifying payment: ${transactionReference}`);

      const response = await axios.get(
        `${this.baseURL}/transaction/verify/${transactionReference}`,
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ Verification response:', response.data);

      const isSuccess = response.data.status === 'success';

      return {
        success: isSuccess,
        data: response.data,
        message: isSuccess ? 'Payment verified successfully' : 'Payment verification failed',
      };
    } catch (error) {
      console.error('❌ Payment verification error:', error.response?.data || error.message);

      return {
        success: false,
        error: error.response?.data || error.message,
        message: 'Error verifying payment',
      };
    }
  }

  /* ==========================================================================
     Payment Initialization
     ========================================================================== */

  /**
   * Initialize a new payment with Chapa.
   *
   * @param {Object} paymentData - Payment details
   * @param {number} paymentData.amount - Payment amount
   * @param {string} paymentData.email - Customer email
   * @param {string} paymentData.firstName - Customer first name
   * @param {string} paymentData.lastName - Customer last name
   * @param {string} paymentData.phoneNumber - Customer phone number
   * @param {string} paymentData.tx_ref - Unique transaction reference
   * @param {string} paymentData.returnUrl - URL to redirect after payment
   * @param {string} paymentData.callbackUrl - Webhook URL for payment notifications
   * @returns {Promise<Object>} Initialization result containing:
   *   - success: boolean indicating if initialization succeeded
   *   - data: Chapa response data
   *   - checkoutUrl: URL to redirect user for payment
   *
   * @example
   * const result = await chapaService.initializePayment({
   *   amount: 100,
   *   email: 'customer@example.com',
   *   firstName: 'John',
   *   lastName: 'Doe',
   *   phoneNumber: '+251912345678',
   *   tx_ref: 'UN-LISTING-123',
   *   returnUrl: 'https://example.com/dashboard',
   *   callbackUrl: 'https://api.example.com/webhook/chapa',
   * });
   */
  async initializePayment(paymentData) {
    try {
      const {
        amount,
        email,
        firstName,
        lastName,
        phoneNumber,
        tx_ref,
        returnUrl,
        callbackUrl,
      } = paymentData;

      const payload = {
        amount: amount.toString(),
        currency: 'ETB',
        email,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        tx_ref,
        return_url: returnUrl,
        callback_url: callbackUrl,
        customization: {
          title: 'UrbanNest Payment',
          description: 'Payment for property services',
        },
      };

      console.log('💳 Initializing payment:', payload);

      const response = await axios.post(
        `${this.baseURL}/transaction/initialize`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        data: response.data,
        checkoutUrl: response.data.data.checkout_url,
      };
    } catch (error) {
      console.error('❌ Payment initialization error:', error.response?.data || error.message);

      return {
        success: false,
        error: error.response?.data || error.message,
        message: 'Error initializing payment',
      };
    }
  }
}

/* ==========================================================================
   Export Singleton Instance
   ========================================================================== */

export default new ChapaService();
