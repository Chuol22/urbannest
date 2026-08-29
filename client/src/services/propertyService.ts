// client/src/services/propertyService.ts

import type { CreatePropertyData, Property, PropertyFilters, PaginatedResponse } from '../types';
import { apiClient } from '../utils/apiClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

export const propertyService = {
  /**
   * Get all properties with filters and pagination
   */
  async getProperties(filters: PropertyFilters = {}, page = 1, limit = 10): Promise<PaginatedResponse<Property>> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.type && filters.type !== 'all' && { type: filters.type }),
        ...(filters.minPrice !== undefined && { minPrice: filters.minPrice.toString() }),
        ...(filters.maxPrice !== undefined && { maxPrice: filters.maxPrice.toString() }),
        ...(filters.bedrooms !== undefined && { bedrooms: filters.bedrooms.toString() }),
        ...(filters.bathrooms !== undefined && { bathrooms: filters.bathrooms.toString() }),
        ...(filters.location && { location: filters.location }),
        ...(filters.amenities && filters.amenities.length > 0 && { amenities: filters.amenities.join(',') })
      });

      const response = await apiClient.get(`${API_BASE_URL}/properties?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }
  },

  /**
   * Get property by ID
   */
  async getPropertyById(id: string): Promise<Property> {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/properties/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching property:', error);
      throw error;
    }
  },

  /**
   * Create a new property
   */
  async createProperty(propertyData: CreatePropertyData): Promise<Property> {
    console.log('[Property Service] Creating property with data:', propertyData);

    try {
      const url = `${API_BASE_URL}/properties`;
      console.log('[Property Service] POST URL:', url);

      const response = await apiClient.post(url, propertyData);
      console.log('[Property Service] Create property response:', response.data);

      return response.data;
    } catch (error: any) {
      console.error('[Property Service] Error creating property:', error);
      console.error('[Property Service] Error response:', error.response?.data);
      console.error('[Property Service] Error status:', error.response?.status);
      console.error('[Property Service] Error message:', error.message);

      // Provide more specific error information
      if (error.code === 'ECONNABORTED') {
        console.error('[Property Service] Request timeout - operation took too long');
      }

      throw error;
    }
  },

  /**
   * Update an existing property
   */
  async updateProperty(id: string, propertyData: Partial<CreatePropertyData>): Promise<Property> {
    try {
      const response = await apiClient.put(`${API_BASE_URL}/properties/${id}`, propertyData);
      return response.data;
    } catch (error) {
      console.error('Error updating property:', error);
      throw error;
    }
  },

  /**
   * Delete a property
   */
  async deleteProperty(id: string): Promise<void> {
    try {
      await apiClient.delete(`${API_BASE_URL}/properties/${id}`);
    } catch (error) {
      console.error('Error deleting property:', error);
      throw error;
    }
  },

  /**
   * Get featured properties
   * The backend returns { success: true, data: [...] } — we extract the data array.
   */
  async getFeaturedProperties(limit = 6): Promise<Property[]> {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/properties/featured?limit=${limit}`);
      // Backend wraps response: { success: true, data: [...] }
      const payload = response.data;
      return Array.isArray(payload) ? payload : (payload?.data ?? []);
    } catch (error) {
      console.error('Error fetching featured properties:', error);
      return []; // Return empty array on error instead of crashing
    }
  },

  /**
   * Search properties
   */
  async searchProperties(query: string, limit = 10): Promise<Property[]> {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/properties/search?q=${encodeURIComponent(query)}&limit=${limit}`);
      const payload = response.data;
      return Array.isArray(payload) ? payload : (payload?.data ?? []);
    } catch (error) {
      console.error('Error searching properties:', error);
      return [];
    }
  },

  /**
   * Upload property photos
   */
  async uploadPropertyPhotos(propertyId: string, formData: FormData): Promise<any> {
    try {
      const response = await apiClient.post(`${API_BASE_URL}/properties/${propertyId}/photos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading photos:', error);
      throw error;
    }
  },

  /**
   * Get property photos
   */
  async getPropertyPhotos(propertyId: string): Promise<any[]> {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/properties/${propertyId}/photos`);
      const payload = response.data;
      return Array.isArray(payload) ? payload : (payload?.data ?? []);
    } catch (error) {
      console.error('Error fetching property photos:', error);
      return [];
    }
  },

  /**
   * Delete property photo
   */
  async deletePropertyPhoto(propertyId: string, photoId: string): Promise<void> {
    try {
      await apiClient.delete(`${API_BASE_URL}/properties/${propertyId}/photos/${photoId}`);
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  },

  /**
   * Set primary photo
   */
  async setPrimaryPhoto(propertyId: string, photoId: string): Promise<void> {
    try {
      await apiClient.patch(`${API_BASE_URL}/properties/${propertyId}/photos/${photoId}/primary`);
    } catch (error) {
      console.error('Error setting primary photo:', error);
      throw error;
    }
  },

  /**
   * Get user's properties
   */
  async getUserProperties(page = 1, limit = 10): Promise<PaginatedResponse<Property>> {
    console.log('[Property Service] Getting user properties - page:', page, 'limit:', limit);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      const url = `${API_BASE_URL}/properties/user/me?${params}`;
      console.log('[Property Service] Request URL:', url);

      const response = await apiClient.get(url);
      console.log('[Property Service] User properties response:', response.data);

      return response.data;
    } catch (error: any) {
      console.error('[Property Service] Error fetching user properties:', error);
      console.error('[Property Service] Error response:', error.response?.data);
      console.error('[Property Service] Error status:', error.response?.status);
      throw error;
    }
  }
};