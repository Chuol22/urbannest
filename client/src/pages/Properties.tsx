// client/src/pages/Properties.tsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PropertyGrid } from '../components/property/PropertyGrid';
import { PropertyFilters } from '../components/property/PropertyFilters';
import { useProperties } from '../hooks/useProperties';
import { Loader } from '../components/ui/Loader';

export default function Properties() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    properties,
    loading,
    pagination,
    filters,
    setFilters,
    clearFilters,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
  } = useProperties({ autoFetch: false }); // Set autoFetch to false to handle manually

  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [initialLoad, setInitialLoad] = useState(true);

  // Get filter values from URL parameters
  const urlType = searchParams.get('type'); // 'rent', 'sale', 'commercial', 'luxury'
  const urlLocation = searchParams.get('location');
  const urlMinPrice = searchParams.get('minPrice');
  const urlMaxPrice = searchParams.get('maxPrice');
  const urlBedrooms = searchParams.get('bedrooms');
  const urlPage = searchParams.get('page');

  // Map URL property types to filter categories
  const mapPropertyType = (type: string | null) => {
    switch(type) {
      case 'rent':
        return { listingType: 'rent' };
      case 'sale':
        return { listingType: 'sale' };
      case 'commercial':
        return { category: 'commercial' };
      case 'luxury':
        return { category: 'luxury' };
      default:
        return {};
    }
  };

  // Initialize filters from URL on mount
  useEffect(() => {
    if (initialLoad) {
      const urlFilters: any = {
        ...mapPropertyType(urlType),
        ...(urlLocation && { location: urlLocation }),
        ...(urlMinPrice && { minPrice: parseInt(urlMinPrice) }),
        ...(urlMaxPrice && { maxPrice: parseInt(urlMaxPrice) }),
        ...(urlBedrooms && { bedrooms: parseInt(urlBedrooms) }),
        ...(urlPage && { page: parseInt(urlPage) }),
      };
      
      if (Object.keys(urlFilters).length > 0) {
        setFilters(urlFilters);
      }
      setInitialLoad(false);
    }
  }, [urlType, urlLocation, urlMinPrice, urlMaxPrice, urlBedrooms, urlPage]);

  // Fetch properties when filters change
  useEffect(() => {
    if (!initialLoad) {
      // Update URL with current filters
      const newParams: any = {};
      
      if (filters.listingType) newParams.type = filters.listingType;
      if (filters.category === 'commercial') newParams.type = 'commercial';
      if (filters.category === 'luxury') newParams.type = 'luxury';
      if (filters.location) newParams.location = filters.location;
      if (filters.minPrice) newParams.minPrice = filters.minPrice;
      if (filters.maxPrice) newParams.maxPrice = filters.maxPrice;
      if (filters.bedrooms) newParams.bedrooms = filters.bedrooms;
      if (filters.page && filters.page > 1) newParams.page = filters.page;
      
      setSearchParams(newParams, { replace: true });
      
      // Your existing fetch logic would go here
      // The useProperties hook should handle the actual fetching
    }
  }, [filters, setSearchParams, initialLoad]);

  const handleFilterChange = (newFilters: unknown) => {
    setFilters(newFilters);
  };

  const handleFavoriteToggle = (propertyId: string) => {
    if (isFavorite(propertyId)) {
      removeFromFavorites(propertyId);
    } else {
      addToFavorites(propertyId);
    }
  };

  // Get the current property type for display
  const getCurrentPropertyType = () => {
    if (filters.listingType === 'rent') return 'Rent';
    if (filters.listingType === 'sale') return 'Sale';
    if (filters.category === 'commercial') return 'Commercial';
    if (filters.category === 'luxury') return 'Luxury';
    return 'All Properties';
  };

  // Get the title based on filters
  const getPageTitle = () => {
    const type = getCurrentPropertyType();
    const location = filters.location;
    
    if (location) {
      return `${type} Properties in ${location}`;
    }
    return `Find Your Perfect ${type}`;
  };

  const getPageDescription = () => {
    const type = getCurrentPropertyType();
    const total = pagination.total;
    
    if (type === 'Rent') {
      return `Discover ${total} rental properties available for your next home`;
    } else if (type === 'Sale') {
      return `Find your dream home among ${total} properties for sale`;
    } else if (type === 'Commercial') {
      return `Explore ${total} commercial spaces for your business`;
    } else if (type === 'Luxury') {
      return `Experience luxury living with ${total} premium properties`;
    }
    return `Discover ${total} properties available for ${type.toLowerCase()}`;
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with dynamic title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {getPageTitle()}
          </h1>
          <p className="text-gray-600">
            {getPageDescription()}
          </p>
          
          {/* Active filters badges */}
          {Object.keys(filters).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {filters.listingType && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  {filters.listingType === 'rent' ? 'For Rent' : 'For Sale'}
                  <button
                    onClick={() => setFilters({ ...filters, listingType: undefined })}
                    className="ml-2 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.category && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  {filters.category === 'commercial' ? 'Commercial' : 'Luxury'}
                  <button
                    onClick={() => setFilters({ ...filters, category: undefined })}
                    className="ml-2 text-purple-600 hover:text-purple-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.location && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  Location: {filters.location}
                  <button
                    onClick={() => setFilters({ ...filters, location: undefined })}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.minPrice && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                  Min: ETB {filters.minPrice.toLocaleString()}
                  <button
                    onClick={() => setFilters({ ...filters, minPrice: undefined })}
                    className="ml-2 text-orange-600 hover:text-orange-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.maxPrice && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                  Max: ETB {filters.maxPrice.toLocaleString()}
                  <button
                    onClick={() => setFilters({ ...filters, maxPrice: undefined })}
                    className="ml-2 text-orange-600 hover:text-orange-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {(Object.keys(filters).length > 0) && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-red-600 hover:text-red-800 underline"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 text-green-600 hover:text-green-700"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        <motion.div
          initial={false}
          animate={{ height: showFilters ? 'auto' : 0, opacity: showFilters ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden mb-6"
        >
          <PropertyFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={clearFilters}
            showAdvanced
          />
        </motion.div>

        {/* Results Count */}
        <div className="mb-6 text-sm text-gray-500">
          Showing {properties.length} of {pagination.total} properties
        </div>

        {/* Property Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader size="lg" />
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No properties found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your filters or search criteria.
            </p>
            <button
              onClick={clearFilters}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <PropertyGrid
            properties={properties}
            loading={loading}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            currentPage={pagination.page}
            onPageChange={(page) => setFilters({ ...filters, page })}
            onFavoriteToggle={handleFavoriteToggle}
            gridCols={viewMode === 'grid' ? 3 : 1}
          />
        )}
      </div>
    </div>
  );
}