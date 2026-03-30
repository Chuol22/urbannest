import { useState } from 'react';
import { Search, MapPin, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { BirrIcon } from '../icons/BirrIcon';

interface SearchFilters {
  searchType: string;
  location: string;
  propertyType: string;
  priceRange: string;
  searchTerm?: string;
}

interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  initialFilters?: Partial<SearchFilters>;
}

const SearchBar = ({ onSearch, initialFilters = {} }: SearchBarProps) => {
  const [searchType, setSearchType] = useState(initialFilters.searchType || 'rent');
  const [location, setLocation] = useState(initialFilters.location || '');
  const [propertyType, setPropertyType] = useState(initialFilters.propertyType || '');
  const [priceRange, setPriceRange] = useState(initialFilters.priceRange || '');

  const handleSearch = () => {
    const filters: SearchFilters = {
      searchType,
      location,
      propertyType,
      priceRange,
      searchTerm: location,
    };
    onSearch(filters);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-4xl mx-auto">
      {/* Search Type Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        {[
          { value: 'rent', label: 'For Rent' },
          { value: 'buy', label: 'For Buy' },
          { value: 'short-term', label: 'Short Term' }
        ].map((type) => (
          <button
            key={type.value}
            onClick={() => setSearchType(type.value)}
            className={`pb-3 px-4 text-lg font-medium transition-colors relative
              ${searchType === type.value 
                ? 'text-green-600' 
                : 'text-gray-500 hover:text-gray-700'}`}
          >
            {type.label}
            {searchType === type.value && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Search Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Location Input */}
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Enter location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Property Type Select */}
        <div className="relative">
          <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white cursor-pointer"
          >
            <option value="">Property Type</option>
            <option value="apartment">Apartment</option>
            <option value="house">House</option>
            <option value="condo">Condo</option>
            <option value="studio">Studio</option>
            <option value="commercial">Commercial Building</option>
            <option value="office">Office</option>
            <option value="townhouse">Townhouse</option>
          </select>
        </div>

        {/* Price Range Select */}
        <div className="relative">
          <BirrIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <select
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white cursor-pointer"
          >
            <option value="">Price Range</option>
            <option value="0-10000">ብር 0 - ብር 10,000</option>
            <option value="10000-20000">ብር 10,000 - ብር 20,000</option>
            <option value="20000-35000">ብር 20,000 - ብር 35,000</option>
            <option value="35000-50000">ብር 35,000 - ብር 50,000</option>
            <option value="50000-100000">ብር 50,000 - ብር 100,000</option>
            <option value="100000+">ብር 100,000+</option>
          </select>
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          className="bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl transition-colors shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
        >
          <Search size={20} />
          <span>Find Your Home</span>
        </button>
      </div>

      {/* Quick Filters */}
      <div className="mt-6 flex flex-wrap gap-2 items-center">
        <span className="text-sm text-gray-500 font-medium">Popular Locations:</span>
        {['Bole Airport', 'Bole 24', 'CMC', 'Goro', 'Gerji', 'Koyei', 'Magenanya', 'Mexico'].map((tag) => (
          <button
            key={tag}
            onClick={() => setLocation(tag)}
            className="text-sm px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full hover:bg-green-100 hover:text-green-700 transition-colors"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchBar;