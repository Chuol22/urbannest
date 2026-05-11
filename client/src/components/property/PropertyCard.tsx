import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaBed, FaBath, FaRuler, FaHeart, FaRegHeart, FaMapMarkerAlt } from 'react-icons/fa';

interface PropertyCardProps {
  property: any;
  onFavoriteToggle?: (id: string) => void;
  isFavorite?: boolean;
  viewMode?: 'grid' | 'list';
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ 
  property, 
  onFavoriteToggle, 
  isFavorite = false,
  viewMode = 'grid'
}) => {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFavoriteToggle?.(property.id);
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        whileHover={{ y: -5 }}
        className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
      >
        <Link to={`/property/${property.id}`} className="flex flex-col md:flex-row">
          <div className="md:w-72 h-56 relative overflow-hidden">
            <img 
              src={property.image || property.photos?.[0]?.url || 'https://via.placeholder.com/300'} 
              alt={property.title}
              className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
            />
            <button
              onClick={handleFavoriteClick}
              className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all"
            >
              {isFavorite ? (
                <FaHeart className="text-red-500" size={18} />
              ) : (
                <FaRegHeart className="text-gray-600" size={18} />
              )}
            </button>
            {property.is_featured && (
              <span className="absolute top-3 left-3 px-2 py-1 bg-amber-600 text-white text-xs font-semibold rounded-lg">
                Featured
              </span>
            )}
          </div>
          <div className="flex-1 p-6">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                {property.title}
              </h3>
              <div className="text-right">
                <span className="text-2xl font-bold text-blue-600">
                  ETB {property.price?.toLocaleString()}
                </span>
                <span className="text-gray-500 text-sm">/{property.period || 'month'}</span>
              </div>
            </div>
            
            <div className="flex items-center text-gray-500 mb-4">
              <FaMapMarkerAlt className="mr-1" size={14} />
              <span className="text-sm">{property.location?.city || property.location}, Ethiopia</span>
            </div>
            
            <p className="text-gray-600 mb-4 line-clamp-2">{property.description}</p>
            
            <div className="flex items-center space-x-4 text-gray-500">
              {property.bedrooms > 0 && (
                <div className="flex items-center">
                  <FaBed className="mr-1" size={16} />
                  <span className="text-sm">{property.bedrooms} beds</span>
                </div>
              )}
              {property.bathrooms > 0 && (
                <div className="flex items-center">
                  <FaBath className="mr-1" size={16} />
                  <span className="text-sm">{property.bathrooms} baths</span>
                </div>
              )}
              {property.sqft > 0 && (
                <div className="flex items-center">
                  <FaRuler className="mr-1" size={16} />
                  <span className="text-sm">{property.sqft} sqft</span>
                </div>
              )}
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  // Grid view (default)
  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden"
    >
      <Link to={`/property/${property.id}`}>
        <div className="relative h-56 overflow-hidden">
          <img 
            src={property.image || property.photos?.[0]?.url || 'https://via.placeholder.com/300'} 
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <button
            onClick={handleFavoriteClick}
            className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all opacity-0 group-hover:opacity-100"
          >
            {isFavorite ? (
              <FaHeart className="text-red-500" size={16} />
            ) : (
              <FaRegHeart className="text-gray-600" size={16} />
            )}
          </button>
          {property.is_featured && (
            <span className="absolute top-3 left-3 px-2 py-1 bg-amber-600 text-white text-xs font-semibold rounded-lg">
              Featured
            </span>
          )}
          {property.discount && (
            <span className="absolute bottom-3 left-3 px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded-lg">
              -{property.discount}% OFF
            </span>
          )}
        </div>
        
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
              {property.title}
            </h3>
            <div className="text-right">
              <span className="text-lg font-bold text-blue-600">
                ETB {property.price?.toLocaleString()}
              </span>
              <span className="text-gray-500 text-xs">/{property.period || 'month'}</span>
            </div>
          </div>
          
          <div className="flex items-center text-gray-500 mb-3">
            <FaMapMarkerAlt className="mr-1" size={12} />
            <span className="text-xs">{property.location?.city || property.location}</span>
          </div>
          
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center space-x-3 text-gray-500">
              {property.bedrooms > 0 && (
                <div className="flex items-center">
                  <FaBed className="mr-1" size={12} />
                  <span className="text-xs">{property.bedrooms}</span>
                </div>
              )}
              {property.bathrooms > 0 && (
                <div className="flex items-center">
                  <FaBath className="mr-1" size={12} />
                  <span className="text-xs">{property.bathrooms}</span>
                </div>
              )}
              {property.sqft > 0 && (
                <div className="flex items-center">
                  <FaRuler className="mr-1" size={12} />
                  <span className="text-xs">{property.sqft}</span>
                </div>
              )}
            </div>
            <div className="text-xs text-gray-400">
              {property.created_at && new Date(property.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default PropertyCard;