// src/components/property/PropertyGrid.tsx

import { Button } from '../ui/Button';
import { Loader } from '../ui/Loader';
import PropertyCard from './PropertyCard';

interface Property {
  id: string;
  title: string;
  location: string;
  price: number;
  period: string;        // Add this (e.g., "month", "year")
  beds: number;          // Change from bedrooms to beds
  baths: number;         // Change from bathrooms to baths
  sqft: number;          // Change from area to sqft
  type: string;
  image: string;
  isFavorite?: boolean;
}

interface PropertyGridProps {
  properties: Property[];
  loading?: boolean;
  totalItems?: number;
  itemsPerPage?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onFavoriteToggle?: (propertyId: string) => void;
  emptyMessage?: string;
  gridCols?: 1 | 2 | 3 | 4;
}

export const PropertyGrid: React.FC<PropertyGridProps> = ({
  properties,
  loading = false,
  totalItems = 0,
  itemsPerPage = 9,
  currentPage = 1,
  onPageChange,
  onFavoriteToggle,
  emptyMessage = "No properties found",
  gridCols = 3,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const gridColsClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  // Loading State
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader size="lg" />
      </div>
    );
  }

  // Empty State
  if (!properties || properties.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{emptyMessage}</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Try adjusting your search filters or browse all properties.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Grid Container */}
      <div className={`grid ${gridColsClasses[gridCols]} gap-6`}>
        {properties.map((property) => (
          <PropertyCard
            key={property.id}
            property={property}
            onFavoriteToggle={onFavoriteToggle}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <div className="mt-8 flex justify-center">
          <nav className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Previous
            </Button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`
                    px-3 py-1 rounded-md transition-colors border border-gray-300 dark:border-gray-600
                    ${currentPage === page
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  {page}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Next
            </Button>
          </nav>
        </div>
      )}

      {/* Results Info */}
      {totalItems > 0 && (
        <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Showing {properties.length} of {totalItems} properties
        </div>
      )}
    </div>
  );
};