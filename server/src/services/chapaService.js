import axios from 'axios';
import crypto from 'crypto';

class ChapaService {
  constructor() {
    this.secretKey = process.env.CHAPA_SECRET_KEY;
    this.baseURL = process.env.CHAPA_BASE_URL || 'https://api.chapa.co/v1';
    
    if (!this.secretKey) {
      console.error('❌ CHAPA_SECRET_KEY is not set in environment variables');
    }
  }

  /**
   * Verify a payment transaction
   * @param {string} transactionReference - The transaction reference (tx_ref)
   * @returns {Promise<Object>} - Payment verification result
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

      console.log(`✅ Verification response:`, response.data);

      if (response.data.status === 'success') {
        return {
          success: true,
          data: response.data,
          message: 'Payment verified successfully'
        };
      } else {
        return {
          success: false,
          data: response.data,
          message: 'Payment verification failed'
        };
      }
    } catch (error) {
      console.error('❌ Payment verification error:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data || error.message,
        message: 'Error verifying payment'
      };
    }
  }

  /**
   * Initialize a new payment (if you need server-side initialization)
   * @param {Object} paymentData - Payment details
   * @returns {Promise<Object>} - Payment initialization result
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
        callbackUrl
      } = paymentData;

      const payload = {
        amount: amount.toString(),
        currency: 'ETB',
        email: email,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        tx_ref: tx_ref,
        return_url: returnUrl,
        callback_url: callbackUrl,
        customization: {
          title: 'UrbanNest Payment',
          description: 'Payment for property services'
        }
      };

      console.log(`💳 Initializing payment:`, payload);

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
        checkoutUrl: response.data.data.checkout_url
      };
    } catch (error) {
      console.error('❌ Payment initialization error:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data || error.message,
        message: 'Error initializing payment'
      };
    }
  }
}

export default new ChapaService();