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
};
