// client/src/services/admin.service.ts
import { apiClient } from '../utils/apiClient';
import { AuditLogFilters } from '../types/admin.types';

export const adminService = {
  // System Dashboard Metrics
  getDashboardStats: async () => {
    const res = await apiClient.get('/admin/dashboard');
    return res.data;
  },

  getUserStats: async (params?: { role?: string; status?: string }) => {
    const res = await apiClient.get('/admin/dashboard/users', { params });
    return res.data;
  },

  getPropertyStats: async () => {
    const res = await apiClient.get('/admin/dashboard/properties');
    return res.data;
  },

  getRevenueStats: async (params?: { from_date?: string; to_date?: string }) => {
    const res = await apiClient.get('/admin/dashboard/revenue', { params });
    return res.data;
  },

  // Admin User Lifecycle Management
  createAdmin: async (data: { email: string; phone: string; password: string; first_name: string; last_name: string }) => {
    const res = await apiClient.post('/admin/users', data);
    return res.data;
  },

  listAdmins: async (params?: { page?: number; limit?: number; active?: boolean; search?: string }) => {
    const res = await apiClient.get('/admin/users', { params });
    return res.data;
  },

  getAdminDetails: async (id: string) => {
    const res = await apiClient.get(`/admin/users/${id}`);
    return res.data;
  },

  updateAdmin: async (id: string, data: { email?: string; phone?: string; first_name?: string; last_name?: string }) => {
    const res = await apiClient.put(`/admin/users/${id}`, data);
    return res.data;
  },

  updateAdminPassword: async (id: string, data: { newPassword: string; currentPassword?: string }) => {
    const res = await apiClient.put(`/admin/users/${id}/password`, data);
    return res.data;
  },

  deactivateAdmin: async (id: string) => {
    const res = await apiClient.post(`/admin/users/${id}/deactivate`);
    return res.data;
  },

  activateAdmin: async (id: string) => {
    const res = await apiClient.post(`/admin/users/${id}/activate`);
    return res.data;
  },

  // 2FA Setup
  enable2FA: async (id: string) => {
    const res = await apiClient.post(`/admin/users/${id}/enable-2fa`);
    return res.data;
  },

  verify2FA: async (id: string, data: { code: string; secret: string }) => {
    const res = await apiClient.post(`/admin/users/${id}/verify-2fa`, data);
    return res.data;
  },

  disable2FA: async (id: string, password: string) => {
    const res = await apiClient.post(`/admin/users/${id}/disable-2fa`, { password });
    return res.data;
  },

  // Audit Logs
  getAuditLogs: async (params?: AuditLogFilters) => {
    const res = await apiClient.get('/admin/audit-logs', { params });
    return res.data;
  },

  getAuditLogDetails: async (id: string) => {
    const res = await apiClient.get(`/admin/audit-logs/${id}`);
    return res.data;
  },

  exportAuditLogsUrl: (params?: AuditLogFilters) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
    return `${baseURL}/admin/audit-logs/export${query ? `?${query}` : ''}`;
  },

  // Enhanced User Management
  getAllUsers: async (params?: { page?: number; limit?: number; role?: string; status?: string; verification_status?: string; search?: string }) => {
    const res = await apiClient.get('/admin/users/all', { params });
    return res.data;
  },

  verifyUser: async (id: string, data: { verification_status: string; rejection_reason?: string }) => {
    const res = await apiClient.put(`/admin/users/all/${id}/verify`, data);
    return res.data;
  },

  deactivateUser: async (id: string, reason?: string) => {
    const res = await apiClient.post(`/admin/users/all/${id}/deactivate`, { reason });
    return res.data;
  },

  activateUser: async (id: string) => {
    const res = await apiClient.post(`/admin/users/all/${id}/activate`);
    return res.data;
  },

  deleteUser: async (id: string) => {
    const res = await apiClient.delete(`/admin/users/all/${id}`);
    return res.data;
  },

  bulkUserAction: async (data: { action: 'approve' | 'reject' | 'activate' | 'deactivate'; user_ids: string[]; reason?: string }) => {
    console.log('[Admin Service] Bulk user action request:', data);
    try {
      const res = await apiClient.post('/admin/users/all/bulk-action', data);
      console.log('[Admin Service] Bulk user action response:', res.data);
      return res.data;
    } catch (error: any) {
      console.error('[Admin Service] Bulk user action error:', error.response?.data || error.message);
      throw error;
    }
  },

  exportUsersUrl: (params?: any) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
    return `${baseURL}/admin/users/all/export${query ? `?${query}` : ''}`;
  },

  // Listing Moderation
  getAllListings: async (params?: { page?: number; limit?: number; status?: string }) => {
    console.log('[Admin Service] Get all listings request:', params);
    try {
      const res = await apiClient.get('/admin/listings', { params });
      console.log('[Admin Service] Get all listings response:', res.data);
      return res.data;
    } catch (error: any) {
      console.error('[Admin Service] Get all listings error:', error.response?.data || error.message);
      throw error;
    }
  },

  getPendingListings: async () => {
    const res = await apiClient.get('/admin/listings/pending');
    return res.data;
  },

  approveListing: async (id: string) => {
    const res = await apiClient.post(`/admin/listings/${id}/approve`);
    return res.data;
  },

  rejectListing: async (id: string, reason: string) => {
    const res = await apiClient.post(`/admin/listings/${id}/reject`, { reason });
    return res.data;
  },

  bulkApproveListings: async (listing_ids: string[]) => {
    const res = await apiClient.post('/admin/listings/bulk-approve', { listing_ids });
    return res.data;
  },

  bulkRejectListings: async (listing_ids: string[], reason: string) => {
    const res = await apiClient.post('/admin/listings/bulk-reject', { listing_ids, reason });
    return res.data;
  },

  // Payments
  getPayments: async (params?: { page?: number; limit?: number; status?: string; from_date?: string; to_date?: string }) => {
    const res = await apiClient.get('/admin/payments', { params });
    return res.data;
  },

  getPaymentConfig: async () => {
    const res = await apiClient.get('/admin/payments/config');
    return res.data?.data || res.data;
  },

  updatePaymentConfig: async (data: { sell_fee: number; rent_fee: number }) => {
    const res = await apiClient.put('/admin/payments/config', data);
    return res.data?.data || res.data;
  },

  getPaymentDetails: async (id: string) => {
    const res = await apiClient.get(`/admin/payments/${id}`);
    return res.data;
  },

  markPaymentCompleted: async (id: string, reason: string) => {
    const res = await apiClient.post(`/admin/payments/${id}/complete`, { reason });
    return res.data;
  },

  exportPaymentsUrl: (params?: any) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
    return `${baseURL}/admin/payments/export${query ? `?${query}` : ''}`;
  },

  // Legacy Brokers
  getPendingBrokers: async () => {
    const res = await apiClient.get('/admin/brokers/pending');
    return res.data;
  },
  approveBroker: async (id: string) => {
    const res = await apiClient.post(`/admin/brokers/${id}/approve`);
    return res.data;
  },
  rejectBroker: async (id: string, reason: string) => {
    const res = await apiClient.post(`/admin/brokers/${id}/reject`, { reason });
    return res.data;
  }
};

export const getAdminService = () => adminService;
