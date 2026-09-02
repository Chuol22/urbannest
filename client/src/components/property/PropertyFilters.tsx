import { useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface FilterOptions {
  search?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  location?: string;
  amenities?: string[];
}

interface PropertyFiltersProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  onReset?: () => void;
  showAdvanced?: boolean;
  className?: string;
}

const PROPERTY_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'condo', label: 'Condo' },
  { value: 'studio', label: 'Studio' },
  { valie: 'commercial', label: 'commerical building' },
  { value: 'townhouse', label: 'Townhouse' },
];

const PRICE_RANGES = [
  { label: 'Any', min: 0, max: Infinity },
  { label: 'Under $1,000', min: 0, max: 1000 },
  { label: '$1,000 - $2,000', min: 1000, max: 2000 },
  { label: '$2,000 - $3,000', min: 2000, max: 3000 },
  { label: '$3,000+', min: 3000, max: Infinity },
];

const BEDROOM_OPTIONS = [1, 2, 3, 4, 5];
const BATHROOM_OPTIONS = [1, 2, 3, 4];

const AMENITIES = [
  'Air Conditioning',
  'Heating',
  'Parking',
  'Pool',
  'Gym',
  'Pet Friendly',
  'Washer/Dryer',
  'Dishwasher',
  'Balcony',
  'Furnished',
];

export const PropertyFilters: React.FC<PropertyFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
  showAdvanced = false,
  className = '',
}) => {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleChange = (key: keyof FilterOptions, value: any) => {
    const updatedFilters = { ...localFilters, [key]: value };
    setLocalFilters(updatedFilters);

    // Auto-apply for basic filters
    if (!showAdvanced) {
      onFilterChange(updatedFilters);
    }
  };

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      search: '',
      type: 'all',
      minPrice: 0,
      maxPrice: Infinity,
      bedrooms: undefined,
      bathrooms: undefined,
      location: '',
      amenities: [],
    };
    setLocalFilters(resetFilters);
    if (onReset) {
      onReset();
    } else {
      onFilterChange(resetFilters);
    }
  };

  const getPriceRangeLabel = () => {
    const range = PRICE_RANGES.find(
      r => r.min === localFilters.minPrice && r.max === localFilters.maxPrice
    );
    return range?.label || 'Custom Range';
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md dark:border dark:border-gray-700 p-4 transition-colors ${className}`}>
      {/* Search Input */}
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Search by location, title, or keyword..."
          value={localFilters.search || ''}
          onChange={(e) => handleChange('search', e.target.value)}
          icon={
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
        />
      </div>

      {/* Basic Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Property Type
          </label>
          <select
            value={localFilters.type || 'all'}
            onChange={(e) => handleChange('type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            {PROPERTY_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Price Range
          </label>
          <select
            value={getPriceRangeLabel()}
            onChange={(e) => {
              const range = PRICE_RANGES.find(r => r.label === e.target.value);
              if (range) {
                handleChange('minPrice', range.min);
                handleChange('maxPrice', range.max);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            {PRICE_RANGES.map((range) => (
              <option key={range.label} value={range.label}>
                {range.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Location
          </label>
          <Input
            type="text"
            placeholder="City, neighborhood, or ZIP"
            value={localFilters.location || ''}
            onChange={(e) => handleChange('location', e.target.value)}
          />
        </div>
      </div>

      {/* Advanced Filters Toggle */}
      {showAdvanced && (
        <div className="mb-4">
          <button
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 text-sm font-medium flex items-center"
          >
            <svg
              className={`w-4 h-4 mr-1 transform transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {isAdvancedOpen ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
          </button>
        </div>
      )}

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <AnimatePresence>
          {isAdvancedOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Bedrooms
                    </label>
                    <div className="flex space-x-2">
                      {BEDROOM_OPTIONS.map((num) => (
                        <button
                          key={num}
                          onClick={() => handleChange('bedrooms', localFilters.bedrooms === num ? undefined : num)}
                          className={`
                            px-3 py-1 rounded-md transition-colors
                            ${localFilters.bedrooms === num
                              ? 'bg-amber-600 text-white font-semibold'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }
                          `}
                        >
                          {num}
                        </button>
                      ))}
                      <button
                        onClick={() => handleChange('bedrooms', undefined)}
                        className="px-3 py-1 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Any
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Bathrooms
                    </label>
                    <div className="flex space-x-2">
                      {BATHROOM_OPTIONS.map((num) => (
                        <button
                          key={num}
                          onClick={() => handleChange('bathrooms', localFilters.bathrooms === num ? undefined : num)}
                          className={`
                            px-3 py-1 rounded-md transition-colors
                            ${localFilters.bathrooms === num
                              ? 'bg-amber-600 text-white font-semibold'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }
                          `}
                        >
                          {num}
                        </button>
                      ))}
                      <button
                        onClick={() => handleChange('bathrooms', undefined)}
                        className="px-3 py-1 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Any
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Amenities
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {AMENITIES.map((amenity) => (
                      <label key={amenity} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={localFilters.amenities?.includes(amenity) || false}
                          onChange={(e) => {
                            const currentAmenities = localFilters.amenities || [];
                            const updatedAmenities = e.target.checked
                              ? [...currentAmenities, amenity]
                              : currentAmenities.filter(a => a !== amenity);
                            handleChange('amenities', updatedAmenities);
                          }}
                          className="rounded border-gray-300 dark:border-gray-600 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{amenity}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3 mt-4">
        {showAdvanced && (
          <Button
            variant="primary"
            onClick={handleApplyFilters}
            className="flex-1"
          >
            Apply Filters
          </Button>
        )}
        <Button
          variant="outline"
          onClick={handleReset}
          className={showAdvanced ? 'flex-1' : ''}
        >
          Reset Filters
        </Button>
      </div>
    </div>
  );
};