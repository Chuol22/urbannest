// client/src/services/paymentService.ts
import { apiClient } from '../utils/apiClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

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

export const paymentService = {
  /**
   * Get available payment plans
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
   * Initialize payment for property listing (legacy)
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
   * Initialize Chapa listing fee for a specific property.
   * Returns { success, data: { checkout_url, tx_ref, amount } }
   */
  async initializeListingFee(propertyId: string): Promise<PaymentResponse> {
    try {
      const response = await apiClient.post(`${API_BASE_URL}/properties/${propertyId}/listing-fee`);
      return response.data;
    } catch (error) {
      console.error('Error initializing listing fee:', error);
      throw error;
    }
  },

  /**
   * Verify listing fee payment with Chapa after redirect.
   * Returns { success, message }
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
   * Verify payment status
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
   * Get user's listing fee payment history
   */
  async getPaymentHistory(): Promise<PaymentResponse> {
    try {
      // Returns listing_fee_payments for the logged-in broker
      const response = await apiClient.get(`${API_BASE_URL}/payments/history`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment history:', error);
      return { success: false, data: [], message: 'Failed to load payment history' };
    }
  },
};
