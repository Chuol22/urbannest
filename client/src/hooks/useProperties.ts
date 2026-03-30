import { useState, useEffect, useCallback, useMemo } from 'react';
import { useProperties as usePropertiesContext } from '../context/PropertyContext';
import { useDebounce } from './useDebounce';

interface UsePropertiesOptions {
  autoFetch?: boolean;
  initialFilters?: any;
  enableSearch?: boolean;
  searchDelay?: number;
}

interface UsePropertiesReturn {
  // Data
  properties: any[];
  featuredProperties: any[];
  favorites: string[];
  loading: boolean;
  error: string | null;
  
  // Pagination
  pagination: {
    page: number;
    total: number;
    totalPages: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  
  // Filters
  filters: any;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  setFilters: (filters: any) => void;
  clearFilters: () => void;
  
  // Actions
  getProperties: () => Promise<void>;
  getPropertyById: (id: string) => Promise<any>;
  addToFavorites: (id: string) => Promise<void>;
  removeFromFavorites: (id: string) => Promise<void>;
  isFavorite: (id: string) => boolean;
  
  // Pagination actions
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  
  // Loading states
  isFetching: boolean;
  isFiltering: boolean;
}

export const useProperties = (options: UsePropertiesOptions = {}): UsePropertiesReturn => {
  const {
    autoFetch = true,
    initialFilters = {},
    enableSearch = true,
    searchDelay = 500,
  } = options;

  const context = usePropertiesContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);
  
  const debouncedSearchTerm = useDebounce(searchTerm, searchDelay);

  // Memoized filters with search term
  const activeFilters = useMemo(() => {
    const filters = { ...context.filters, ...initialFilters };
    
    if (enableSearch && debouncedSearchTerm) {
      filters.search = debouncedSearchTerm;
    }
    
    return filters;
  }, [context.filters, initialFilters, enableSearch, debouncedSearchTerm]);

  // Fetch properties when filters change
  useEffect(() => {
    if (autoFetch) {
      setIsFiltering(true);
      context.getProperties(activeFilters).finally(() => {
        setIsFiltering(false);
      });
    }
  }, [activeFilters, autoFetch]);

  // Fetch featured properties on mount
  useEffect(() => {
    if (autoFetch) {
      context.getFeaturedProperties();
    }
  }, [autoFetch]);

  // Fetch favorites on mount if user is logged in
  useEffect(() => {
    if (autoFetch && context.favorites.length === 0) {
      context.getFavorites();
    }
  }, [autoFetch]);

  const getProperties = useCallback(async () => {
    await context.getProperties(activeFilters);
  }, [context, activeFilters]);

  const getPropertyById = useCallback(async (id: string) => {
    return await context.getPropertyById(id);
  }, [context]);

  const addToFavorites = useCallback(async (id: string) => {
    await context.addToFavorites(id);
  }, [context]);

  const removeFromFavorites = useCallback(async (id: string) => {
    await context.removeFromFavorites(id);
  }, [context]);

  const isFavorite = useCallback((id: string) => {
    return context.favorites.includes(id);
  }, [context.favorites]);

  const setFilters = useCallback((filters: any) => {
    context.setFilters(filters);
  }, [context]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    context.clearFilters();
  }, [context]);

  const nextPage = useCallback(() => {
    if (context.pagination.page < context.pagination.totalPages) {
      context.setFilters({ page: context.pagination.page + 1 });
    }
  }, [context]);

  const prevPage = useCallback(() => {
    if (context.pagination.page > 1) {
      context.setFilters({ page: context.pagination.page - 1 });
    }
  }, [context]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= context.pagination.totalPages) {
      context.setFilters({ page });
    }
  }, [context]);

  const pagination = useMemo(() => ({
    ...context.pagination,
    hasNext: context.pagination.page < context.pagination.totalPages,
    hasPrev: context.pagination.page > 1,
  }), [context.pagination]);

  return {
    // Data
    properties: context.properties,
    featuredProperties: context.featuredProperties,
    favorites: context.favorites,
    loading: context.loading,
    error: context.error,
    
    // Pagination
    pagination,
    
    // Filters
    filters: activeFilters,
    searchTerm,
    setSearchTerm,
    setFilters,
    clearFilters,
    
    // Actions
    getProperties,
    getPropertyById,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    
    // Pagination actions
    nextPage,
    prevPage,
    goToPage,
    
    // Loading states
    isFetching: context.loading,
    isFiltering,
  };
};

// Specific hooks for different property operations
export const useFeaturedProperties = () => {
  const context = usePropertiesContext();
  
  useEffect(() => {
    context.getFeaturedProperties();
  }, []);
  
  return {
    properties: context.featuredProperties,
    loading: context.loading,
    error: context.error,
  };
};

export const useFavorites = () => {
  const context = usePropertiesContext();
  
  useEffect(() => {
    context.getFavorites();
  }, []);
  
  const favoriteProperties = useMemo(() => {
    return context.properties.filter(prop => context.favorites.includes(prop.id));
  }, [context.properties, context.favorites]);
  
  return {
    favorites: context.favorites,
    favoriteProperties,
    loading: context.loading,
    addToFavorites: context.addToFavorites,
    removeFromFavorites: context.removeFromFavorites,
    isFavorite: (id: string) => context.favorites.includes(id),
  };
};

export const usePropertyDetails = (id: string) => {
  const context = usePropertiesContext();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      setLoading(true);
      context.getPropertyById(id)
        .then(data => {
          setProperty(data);
          setError(null);
        })
        .catch(err => {
          setError(err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id, context]);

  return {
    property,
    loading,
    error,
    isFavorite: property ? context.favorites.includes(property.id) : false,
    addToFavorites: () => property && context.addToFavorites(property.id),
    removeFromFavorites: () => property && context.removeFromFavorites(property.id),
  };
};