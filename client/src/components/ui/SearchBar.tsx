// src/components/ui/SearchBar.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, Home, X, Loader, Building2, Map as MapIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Ethiopian Cities Data
const ETHIOPIAN_CITIES = [
  { name: 'Addis Ababa', region: 'Addis Ababa', neighborhoods: ['Bole', 'CMC', 'Kazanchis', 'Piassa', 'Megenagna', 'Mexico', 'Goro', 'Gerji', 'Koyei', 'Ayat', 'Jemo', 'Saris', 'Lebanon', 'Urael', 'Bole Airport', 'Bole 24'] },
  { name: 'Gambella', region: 'Gambella', neighborhoods: [] },
  { name: 'Hawassa', region: 'Sidama', neighborhoods: [] },
  { name: 'Bahir Dar', region: 'Amhara', neighborhoods: [] },
  { name: 'Dire Dawa', region: 'Dire Dawa', neighborhoods: [] },
  { name: 'Mekelle', region: 'Tigray', neighborhoods: [] },
  { name: 'Adama', region: 'Oromia', neighborhoods: [] },
  { name: 'Jimma', region: 'Oromia', neighborhoods: [] },
  { name: 'Gondar', region: 'Amhara', neighborhoods: [] },
  { name: 'Harar', region: 'Harari', neighborhoods: [] },
  { name: 'Dessie', region: 'Amhara', neighborhoods: [] },
  { name: 'Jijiga', region: 'Somali', neighborhoods: [] },
  { name: 'Debre Birhan', region: 'Amhara', neighborhoods: [] },
  { name: 'Debre Markos', region: 'Amhara', neighborhoods: [] },
  { name: 'Asella', region: 'Oromia', neighborhoods: [] },
  { name: 'Nekemte', region: 'Oromia', neighborhoods: [] },
  { name: 'Arba Minch', region: 'South Ethiopia', neighborhoods: [] },
  { name: 'Wolaita Sodo', region: 'South Ethiopia', neighborhoods: [] },
  { name: 'Shashamane', region: 'Oromia', neighborhoods: [] },
  { name: 'Hosaena', region: 'Central Ethiopia', neighborhoods: [] },
  { name: 'Bishoftu', region: 'Oromia', neighborhoods: [] },
  { name: 'Ambo', region: 'Oromia', neighborhoods: [] }
];

interface SearchFilters {
  searchType: string;
  location: string;
  propertyType: string;
  priceRange: string;
  city?: string;
  neighborhood?: string;
  searchTerm?: string;
  coordinates?: { lat: number; lng: number };
}

interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  initialFilters?: Partial<SearchFilters>;
  useOpenStreetMap?: boolean;
}

interface OSMPlace {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  type: string;
  address?: {
    city?: string;
    town?: string;
    state?: string;
    neighbourhood?: string;
    suburb?: string;
  };
}

const SearchBar = ({ onSearch, initialFilters = {}, useOpenStreetMap = false }: SearchBarProps) => {
  const [searchType, setSearchType] = useState(initialFilters.searchType || 'rent');
  const [location, setLocation] = useState(initialFilters.location || '');
  const [selectedCity, setSelectedCity] = useState(initialFilters.city || '');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(initialFilters.neighborhood || '');
  const [propertyType, setPropertyType] = useState(initialFilters.propertyType || '');
  const [priceRange, setPriceRange] = useState(initialFilters.priceRange || '');
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  
  // OSM States
  const [osmSuggestions, setOsmSuggestions] = useState<OSMPlace[]>([]);
  const [showOsmSuggestions, setShowOsmSuggestions] = useState(false);
  const [osmLoading, setOsmLoading] = useState(false);
  
  // Local Search States
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [filteredCities, setFilteredCities] = useState(ETHIOPIAN_CITIES);
  const [showNeighborhoods, setShowNeighborhoods] = useState(false);
  
  const debounceTimer = useRef<number>();
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter cities based on search input (Local Search)
  useEffect(() => {
    if (!useOpenStreetMap && location.trim()) {
      const filtered = ETHIOPIAN_CITIES.filter(city =>
        city.name.toLowerCase().includes(location.toLowerCase()) ||
        city.region?.toLowerCase().includes(location.toLowerCase())
      );
      setFilteredCities(filtered);
      setShowCitySuggestions(true);
    } else {
      setFilteredCities(ETHIOPIAN_CITIES);
      setShowCitySuggestions(false);
    }
  }, [location, useOpenStreetMap]);

  // OpenStreetMap Search Function
  const searchOpenStreetMap = useCallback(async (query: string) => {
    if (!query.trim()) {
      setOsmSuggestions([]);
      return;
    }

    setOsmLoading(true);
    try {
      const searchQuery = `${query}, Ethiopia`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` + new URLSearchParams({
          q: searchQuery,
          format: 'json',
          limit: '8',
          addressdetails: '1',
          countrycodes: 'et',
          'accept-language': 'en'
        }),
        {
          headers: {
            'User-Agent': 'UrbanNestApp/1.0'
          }
        }
      );

      if (!response.ok) throw new Error('OSM API error');
      
      const data: OSMPlace[] = await response.json();
      setOsmSuggestions(data);
      setShowOsmSuggestions(true);
    } catch (error) {
      console.error('OSM search error:', error);
      setOsmSuggestions([]);
    } finally {
      setOsmLoading(false);
    }
  }, []);

  // Handle input change with debounce
  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocation(value);
    
    if (useOpenStreetMap) {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = window.setTimeout(() => {
        searchOpenStreetMap(value);
      }, 500);
    }
  };

  // Handle OSM Location Selection
  const handleOsmSelect = (place: OSMPlace) => {
    setLocation(place.display_name);
    setShowOsmSuggestions(false);
    setSelectedCoordinates({
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon)
    });
    
    const city = place.address?.city || place.address?.town || place.address?.state || '';
    setSelectedCity(city);
  };

  // Handle Local City Selection
  const handleCitySelect = (city: typeof ETHIOPIAN_CITIES[0]) => {
    setSelectedCity(city.name);
    setLocation(city.name);
    setShowCitySuggestions(false);
    setSelectedCoordinates(null);
    
    if (city.neighborhoods && city.neighborhoods.length > 0) {
      setShowNeighborhoods(true);
    } else {
      setShowNeighborhoods(false);
      setSelectedNeighborhood('');
    }
  };

  // Handle Neighborhood Selection
  const handleNeighborhoodSelect = (neighborhood: string) => {
    setSelectedNeighborhood(neighborhood);
    setLocation(`${neighborhood}, ${selectedCity}`);
  };

  // Clear Location
  const clearLocation = () => {
    setLocation('');
    setSelectedCity('');
    setSelectedNeighborhood('');
    setSelectedCoordinates(null);
    setShowNeighborhoods(false);
    setShowCitySuggestions(false);
    setShowOsmSuggestions(false);
    if (inputRef.current) inputRef.current.focus();
  };

  // Handle Search Submission
  const handleSearch = () => {
    const filters: SearchFilters = {
      searchType,
      location,
      propertyType,
      priceRange,
      searchTerm: location,
      city: selectedCity,
      neighborhood: selectedNeighborhood,
      coordinates: selectedCoordinates || undefined
    };
    onSearch(filters);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getLocationDisplayName = () => {
    if (selectedCoordinates) return '📍 Precise Location Selected';
    if (selectedNeighborhood) return `🏘️ ${selectedNeighborhood}, ${selectedCity}`;
    if (selectedCity) return `🏙️ ${selectedCity}`;
    return null;
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
        {/* Location Input with Autocomplete */}
        <div className="relative md:col-span-1">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" size={20} />
          
          <input
            ref={inputRef}
            type="text"
            placeholder={useOpenStreetMap ? "Search any location in Ethiopia..." : "Enter city or neighborhood"}
            value={location}
            onChange={handleLocationChange}
            onKeyPress={handleKeyPress}
            onFocus={() => {
              if (useOpenStreetMap && location) {
                searchOpenStreetMap(location);
              } else if (!useOpenStreetMap && location) {
                setShowCitySuggestions(true);
              }
            }}
            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          />
          
          {location && (
            <button
              onClick={clearLocation}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
            >
              <X size={16} />
            </button>
          )}
          
          {osmLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader size={16} className="animate-spin text-gray-400" />
            </div>
          )}

          {/* OpenStreetMap Suggestions */}
          {useOpenStreetMap && showOsmSuggestions && osmSuggestions.length > 0 && (
            <div className="absolute z-20 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-80 overflow-y-auto">
              {osmSuggestions.map((place) => (
                <button
                  key={place.place_id}
                  onClick={() => handleOsmSelect(place)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {place.type === 'city' ? (
                        <Building2 size={16} className="text-blue-900" />
                      ) : (
                        <MapIcon size={16} className="text-green-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-900">{place.display_name}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Local City Suggestions */}
          {!useOpenStreetMap && showCitySuggestions && filteredCities.length > 0 && (
            <div className="absolute z-20 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-80 overflow-y-auto">
              {filteredCities.map((city, index) => (
                <button
                  key={index}
                  onClick={() => handleCitySelect(city)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">{city.name}</div>
                  <div className="text-sm text-gray-500">{city.region}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Neighborhood Select (Only for Addis Ababa) */}
        {showNeighborhoods && selectedCity === 'Addis Ababa' && (
          <div className="relative">
            <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={selectedNeighborhood}
              onChange={(e) => handleNeighborhoodSelect(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white cursor-pointer"
            >
              <option value="">Select Neighborhood</option>
              {ETHIOPIAN_CITIES.find(c => c.name === selectedCity)?.neighborhoods?.map((neighborhood, idx) => (
                <option key={idx} value={neighborhood}>{neighborhood}</option>
              ))}
            </select>
          </div>
        )}

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

        {/* Price Range Select - Using text instead of BirrIcon */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-bold text-lg">ብር</span>
          <select
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white cursor-pointer"
          >
            <option value="">Price Range</option>
            <option value="0-10000">0 - ብር 10,000</option>
            <option value="10000-20000">ብር 10,000 - 20,000</option>
            <option value="20000-35000">ብር 20,000 - 35,000</option>
            <option value="35000-50000">ብር 35,000 - 50,000</option>
            <option value="50000-100000">ብር 50,000 - 100,000</option>
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

      {/* Selected Location Display */}
      {getLocationDisplayName() && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200"
        >
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-green-600" />
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Searching in:</span> {getLocationDisplayName()}
            </p>
          </div>
        </motion.div>
      )}

      {/* Popular Locations */}
      <div className="mt-6">
        <div className="flex flex-wrap gap-2 items-center mb-3">
          <span className="text-sm text-gray-500 font-medium">Popular Cities:</span>
          {['Addis Ababa', 'Hawassa', 'Bahir Dar', 'Dire Dawa', 'Mekelle', 'Gambella'].map((city) => (
            <button
              key={city}
              onClick={() => {
                const cityData = ETHIOPIAN_CITIES.find(c => c.name === city);
                if (cityData) handleCitySelect(cityData);
              }}
              className="text-sm px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full hover:bg-green-100 hover:text-green-700 transition-colors"
            >
              {city}
            </button>
          ))}
        </div>
        
        {!useOpenStreetMap && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-500 font-medium">Popular Neighborhoods (Addis Ababa):</span>
            {['Bole', 'CMC', 'Kazanchis', 'Piassa', 'Mexico', 'Megenagna', 'Ayat', 'Jemo'].map((neighborhood) => (
              <button
                key={neighborhood}
                onClick={() => {
                  setSelectedCity('Addis Ababa');
                  setSelectedNeighborhood(neighborhood);
                  setLocation(`${neighborhood}, Addis Ababa`);
                  setShowNeighborhoods(true);
                }}
                className="text-sm px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full hover:bg-green-100 hover:text-green-700 transition-colors"
              >
                {neighborhood}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;