/**
 * Payment Service
 *
 * Handles all payment-related API interactions including:
 * - Listing fee initialization and verification
 * - Payment history retrieval
 * - Chapa payment gateway integration
 *
 * @author UrbanNEST Team
 * @version 2.0.0
 */

import { apiClient } from '../utils/apiClient';

/* ==========================================================================
   Configuration
   ========================================================================== */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

/* ==========================================================================
   Types & Interfaces
   ========================================================================== */

export interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  duration: string;
  features: string[];
  listings_limit: number;
  is_popular?: boolean;
}

export interface PaymentData {
  plan_id: string;
  property_id?: string | null;
  amount: number;
  currency: string;
  payment_method: string;
}

export interface PaymentResponse {
  success: boolean;
  data: any;
  message?: string;
}

/* ==========================================================================
   Payment Service API
   ========================================================================== */

export const paymentService = {

  /**
   * Fetch available payment plans.
   *
   * @returns Array of available payment plans
   * @throws Error if request fails
   */
  async getPaymentPlans(): Promise<PaymentPlan[]> {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/payments/plans`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment plans:', error);
      throw error;
    }
  },

  /**
   * Initialize payment for property listing (legacy endpoint).
   *
   * @param paymentData - Payment details including plan, property, and amount
   * @returns Payment response with checkout URL
   * @throws Error if request fails
   */
  async initializePropertyListingPayment(paymentData: PaymentData): Promise<PaymentResponse> {
    try {
      const response = await apiClient.post(`${API_BASE_URL}/payments/property-listing`, paymentData);
      return response.data;
    } catch (error) {
      console.error('Error initializing property listing payment:', error);
      throw error;
    }
  },

  /**
   * Initialize Chapa listing fee payment for a property.
   *
   * This creates a payment session with Chapa and returns the checkout URL
   * for redirecting the user to complete payment.
   *
   * @param propertyId - UUID of the property to pay for
   * @param tier - 'standard' or 'premium' listing tier
   * @returns Payment response containing:
   *   - checkout_url: Chapa payment page URL
   *   - tx_ref: Transaction reference for verification
   *   - amount: Fee amount in ETB
   *   - tier: Selected tier
   *
   * @example
   * const response = await paymentService.initializeListingFee('property-uuid', 'premium');
   * if (response.success) {
   *   window.location.href = response.data.checkout_url;
   * }
   */
  async initializeListingFee(
    propertyId: string,
    tier: 'standard' | 'premium' = 'standard'
  ): Promise<PaymentResponse> {
    try {
      const response = await apiClient.post(
        `${API_BASE_URL}/properties/${propertyId}/listing-fee`,
        { tier }
      );
      return response.data;
    } catch (error) {
      console.error('Error initializing listing fee:', error);
      throw error;
    }
  },

  /**
   * Verify Chapa listing fee payment after redirect.
   *
   * Called when the user returns from Chapa's payment page to confirm
   * the payment status and activate the listing.
   *
   * @param propertyId - UUID of the property
   * @param tx_ref - Transaction reference from Chapa
   * @returns Verification response with payment status and property details
   *
   * @example
   * const response = await paymentService.verifyListingFee('property-uuid', 'tx-ref-123');
   * if (response.success) {
   *   // Payment confirmed, listing is now in admin review queue
   * }
   */
  async verifyListingFee(propertyId: string, tx_ref: string): Promise<PaymentResponse> {
    try {
      const response = await apiClient.post(
        `${API_BASE_URL}/properties/${propertyId}/listing-fee/verify`,
        { tx_ref }
      );
      return response.data;
    } catch (error) {
      console.error('Error verifying listing fee:', error);
      throw error;
    }
  },

  /**
   * Check payment status by ID.
   *
   * @param paymentId - Payment record ID
   * @returns Payment status and details
   * @throws Error if request fails
   */
  async verifyPaymentStatus(paymentId: string): Promise<PaymentResponse> {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/payments/${paymentId}/status`);
      return response.data;
    } catch (error) {
      console.error('Error verifying payment status:', error);
      throw error;
    }
  },

  /**
   * Get the current user's payment history.
   *
   * Returns a list of listing fee payments made by the authenticated broker.
   *
   * @returns Array of payment records or empty array on failure
   */
  async getPaymentHistory(): Promise<PaymentResponse> {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/payments/history`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment history:', error);
      return { success: false, data: [], message: 'Failed to load payment history' };
    }
  },

  /**
   * Get offline manual transfer accounts (Commercial Bank of Ethiopia & Telebirr details)
   */
  async getManualTransferInfo(): Promise<any> {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/properties/manual-transfer-info`);
      return response.data;
    } catch (error) {
      console.warn('[paymentService] Fetch failed, using fallback manual transfer details:', error);
      return {
        success: true,
        data: {
          cbe: {
            bankName: 'Commercial Bank of Ethiopia (CBE)',
            accountNumber: '1000284759281',
            accountName: 'UrbanNEST Real Estate PLC',
            branch: 'Finfinnee Branch, Addis Ababa',
            ussd: '*847#',
            ussdCode: '*847#'
          },
          telebirr: {
            provider: 'Telebirr',
            phoneNumber: '0911478291',
            accountName: 'UrbanNEST Real Estate',
            shortCode: '251911478291',
            ussd: '*127#',
            ussdCode: '*127#'
          },
          feeSchedule: {
            standard: { rent: 50, sale: 100 },
            premium: { rent: 100, sale: 200 }
          }
        }
      };
    }
  },

  /**
   * Submit manual payment proof receipt (image / screenshot)
   */
  async submitManualPayment(
    propertyId: string,
    fileOrFormData: File | FormData,
    options?: {
      paymentMethod?: string;
      tier?: string;
      referenceCode?: string;
      notes?: string;
    }
  ): Promise<PaymentResponse> {
    try {
      let dataToSend: FormData;
      if (fileOrFormData instanceof FormData) {
        dataToSend = fileOrFormData;
      } else {
        dataToSend = new FormData();
        dataToSend.append('receipt', fileOrFormData);
        if (options?.paymentMethod) dataToSend.append('paymentMethod', options.paymentMethod);
        if (options?.tier) dataToSend.append('tier', options.tier);
        if (options?.referenceCode) dataToSend.append('referenceCode', options.referenceCode);
        if (options?.notes) dataToSend.append('notes', options.notes);
      }

      const response = await apiClient.post(
        `${API_BASE_URL}/properties/${propertyId}/manual-payment`,
        dataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error submitting manual payment receipt:', error);
      throw error;
    }
  },

  /**
   * Get payment details and receipt verification status for a property
   */
  async getPropertyPaymentDetails(propertyId: string): Promise<PaymentResponse> {
    try {
      const response = await apiClient.get(
        `${API_BASE_URL}/properties/${propertyId}/payment-details`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching property payment details:', error);
      throw error;
    }
  },
};
