import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { api } from '../services/api';

interface Property {
  id: string;
  title: string;
  description: string;
  location: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  type: string;
  images: string[];
  amenities: string[];
  isAvailable: boolean;
  isFavorite?: boolean;
  landlordId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PropertyFilters {
  search?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  location?: string;
  amenities?: string[];
  page?: number;
  limit?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'oldest';
}

interface PaginatedResponse {
  properties: Property[];
  total: number;
  page: number;
  totalPages: number;
}

interface PropertyContextType {
  properties: Property[];
  featuredProperties: Property[];
  favorites: string[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    total: number;
    totalPages: number;
    limit: number;
  };
  filters: PropertyFilters;
  getProperties: (filters?: PropertyFilters) => Promise<void>;
  getPropertyById: (id: string) => Promise<Property | null>;
  getFeaturedProperties: () => Promise<void>;
  addToFavorites: (propertyId: string) => Promise<void>;
  removeFromFavorites: (propertyId: string) => Promise<void>;
  getFavorites: () => Promise<void>;
  setFilters: (filters: PropertyFilters) => void;
  clearFilters: () => void;
  createProperty: (property: Partial<Property>) => Promise<Property>;
  updateProperty: (id: string, property: Partial<Property>) => Promise<Property>;
  deleteProperty: (id: string) => Promise<void>;
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

export const useProperties = () => {
  const context = useContext(PropertyContext);
  if (!context) {
    throw new Error('useProperties must be used within a PropertyProvider');
  }
  return context;
};

interface PropertyProviderProps {
  children: ReactNode;
}

export const PropertyProvider: React.FC<PropertyProviderProps> = ({ children }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 1,
    limit: 12,
  });
  const [filters, setFiltersState] = useState<PropertyFilters>({
    page: 1,
    limit: 12,
    sortBy: 'newest',
  });

  const getProperties = useCallback(async (newFilters?: PropertyFilters) => {
    setLoading(true);
    setError(null);
    
    try {
      const activeFilters = newFilters || filters;
      const response = await api.get<PaginatedResponse>('/properties', {
        params: activeFilters,
      });
      
      if (response.success) {
        setProperties(response.data.properties);
        setPagination({
          page: response.data.page,
          total: response.data.total,
          totalPages: response.data.totalPages,
          limit: activeFilters.limit || 12,
        });
      } else {
        throw new Error(response.message || 'Failed to fetch properties');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Get properties error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const getPropertyById = useCallback(async (id: string): Promise<Property | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get<Property>(`/properties/${id}`);
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Property not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Get property by id error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getFeaturedProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get<Property[]>('/properties/featured');
      
      if (response.success) {
        setFeaturedProperties(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch featured properties');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Get featured properties error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getFavorites = useCallback(async () => {
    try {
      const response = await api.get<{ favorites: string[] }>('/users/favorites');
      
      if (response.success) {
        setFavorites(response.data.favorites);
      } else {
        throw new Error(response.message || 'Failed to fetch favorites');
      }
    } catch (err) {
      console.error('Get favorites error:', err);
    }
  }, []);

  const addToFavorites = useCallback(async (propertyId: string) => {
    try {
      const response = await api.post(`/users/favorites/${propertyId}`);
      
      if (response.success) {
        setFavorites(prev => [...prev, propertyId]);
        // Update local property favorite status
        setProperties(prev =>
          prev.map(prop =>
            prop.id === propertyId ? { ...prop, isFavorite: true } : prop
          )
        );
      } else {
        throw new Error(response.message || 'Failed to add to favorites');
      }
    } catch (err) {
      console.error('Add to favorites error:', err);
      throw err;
    }
  }, []);

  const removeFromFavorites = useCallback(async (propertyId: string) => {
    try {
      const response = await api.delete(`/users/favorites/${propertyId}`);
      
      if (response.success) {
        setFavorites(prev => prev.filter(id => id !== propertyId));
        // Update local property favorite status
        setProperties(prev =>
          prev.map(prop =>
            prop.id === propertyId ? { ...prop, isFavorite: false } : prop
          )
        );
      } else {
        throw new Error(response.message || 'Failed to remove from favorites');
      }
    } catch (err) {
      console.error('Remove from favorites error:', err);
      throw err;
    }
  }, []);

  const setFilters = useCallback((newFilters: PropertyFilters) => {
    setFiltersState(prev => ({ ...prev, ...newFilters, page: 1 }));
    getProperties({ ...filters, ...newFilters, page: 1 });
  }, [filters, getProperties]);

  const clearFilters = useCallback(() => {
    const defaultFilters: PropertyFilters = {
      page: 1,
      limit: 12,
      sortBy: 'newest',
    };
    setFiltersState(defaultFilters);
    getProperties(defaultFilters);
  }, [getProperties]);

  const createProperty = useCallback(async (property: Partial<Property>): Promise<Property> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post<Property>('/properties', property);
      
      if (response.success) {
        const newProperty = response.data;
        setProperties(prev => [newProperty, ...prev]);
        return newProperty;
      } else {
        throw new Error(response.message || 'Failed to create property');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Create property error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProperty = useCallback(async (id: string, property: Partial<Property>): Promise<Property> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.put<Property>(`/properties/${id}`, property);
      
      if (response.success) {
        const updatedProperty = response.data;
        setProperties(prev =>
          prev.map(prop => (prop.id === id ? updatedProperty : prop))
        );
        return updatedProperty;
      } else {
        throw new Error(response.message || 'Failed to update property');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Update property error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteProperty = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.delete(`/properties/${id}`);
      
      if (response.success) {
        setProperties(prev => prev.filter(prop => prop.id !== id));
      } else {
        throw new Error(response.message || 'Failed to delete property');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Delete property error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const value: PropertyContextType = {
    properties,
    featuredProperties,
    favorites,
    loading,
    error,
    pagination,
    filters,
    getProperties,
    getPropertyById,
    getFeaturedProperties,
    addToFavorites,
    removeFromFavorites,
    getFavorites,
    setFilters,
    clearFilters,
    createProperty,
    updateProperty,
    deleteProperty,
  };

  return (
    <PropertyContext.Provider value={value}>
      {children}
    </PropertyContext.Provider>
  );
};