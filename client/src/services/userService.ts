// client/src/services/userService.ts
import { apiClient } from '../utils/apiClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

export const userService = {
  /**
   * Get user profile
   */
  async getProfile(): Promise<any> {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/users/profile`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(userData: any): Promise<any> {
    try {
      const response = await apiClient.patch(`${API_BASE_URL}/users/profile`, userData);
      return response.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<any> {
    try {
      const response = await apiClient.post(`${API_BASE_URL}/users/change-password`, {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  },

  /**
   * Upload avatar
   */
  async uploadAvatar(file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await apiClient.post(`${API_BASE_URL}/users/avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  },
};
