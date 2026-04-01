// src/components/property/PropertyCard.tsx
import { Heart, Bed, Bath, Square, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { toast } from 'sonner';

// ✅ Property type
interface Property {
  id: string;
  title: string;
  image: string;
  price: number;
  period?: string;
  location: string;
  type: string;
  beds: number;
  baths?: number;
  sqft?: number;
}

// ✅ Props type
interface PropertyCardProps {
  property: Property;
  onFavoriteToggle?: (propertyId: string) => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onFavoriteToggle,
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const navigate = useNavigate();

  const handleFavoriteClick = () => {
    setIsLiked(!isLiked);
    onFavoriteToggle?.(property.id);
    toast.success(isLiked ? 'Removed from favorites' : 'Added to favorites');
  };

  const handleDetailsClick = () => {
    toast.info(`Viewing details for ${property.title}`);
    // Navigate to property details page
    navigate(`/property/${property.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
    >
      {/* Image Section */}
      <div className="relative">
        <img
          src={property.image}
          alt={property.title}
          className="w-full h-56 object-cover"
        />

        <button
          onClick={handleFavoriteClick}
          className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
        >
          <Heart
            size={20}
            className={
              isLiked
                ? 'fill-red-500 text-red-500'
                : 'text-gray-600'
            }
          />
        </button>

        <div className="absolute bottom-4 left-4 bg-[#10B981] text-white px-3 py-1 rounded-lg text-sm font-semibold">
          {property.type}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-semibold text-gray-800 line-clamp-1">
            {property.title}
          </h3>

          <p className="text-2xl font-bold text-[#10B981] whitespace-nowrap">
            ETB{property.price.toLocaleString()}
            <span className="text-sm text-gray-500">
              /{property.period || 'month'}
            </span>
          </p>
        </div>

        <div className="flex items-center text-gray-500 mb-3">
          <MapPin size={16} className="mr-1 flex-shrink-0" />
          <span className="text-sm line-clamp-1">{property.location}</span>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-gray-100 mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Bed size={18} className="text-gray-400" />
              <span className="text-sm text-gray-600">
                {property.beds} beds
              </span>
            </div>

            <div className="flex items-center space-x-1">
              <Bath size={18} className="text-gray-400" />
              <span className="text-sm text-gray-600">
                {property.baths || 0} baths
              </span>
            </div>

            <div className="flex items-center space-x-1">
              <Square size={18} className="text-gray-400" />
              <span className="text-sm text-gray-600">
                {property.sqft || 0} sqft
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="primary" 
            className="flex-1 bg-[#10B981] hover:bg-[#0e9f6e] text-white"
            onClick={handleDetailsClick}
          >
            View Details
          </Button>
          <Button 
            variant="outline" 
            className="px-3"
            onClick={handleFavoriteClick}
          >
            <Heart 
              size={18} 
              className={isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'} 
            />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// ✅ ADD THIS DEFAULT EXPORT
export default PropertyCard;