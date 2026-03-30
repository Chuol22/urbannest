// src/components/property/PropertyGrid.tsx
import PropertyCard from './PropertyCard';
import { Loader } from '../ui/Loader';
import { Button } from '../ui/Button';

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
        <div className="text-6xl mb-4">🏠</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {emptyMessage}
        </h3>
        <p className="text-gray-500">
          Try adjusting your search filters or check back later for new listings.
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
            >
              Previous
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`
                    px-3 py-1 rounded-md transition-colors
                    ${currentPage === page
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
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
            >
              Next
            </Button>
          </nav>
        </div>
      )}

      {/* Results Info */}
      {totalItems > 0 && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Showing {properties.length} of {totalItems} properties
        </div>
      )}
    </div>
  );
};