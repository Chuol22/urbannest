import React from 'react';
import { Link } from 'react-router-dom';

import { motion } from 'framer-motion';
import { FaBath, FaBed, FaHeart, FaMapMarkerAlt, FaRegHeart, FaRuler } from 'react-icons/fa';

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
        className="bg-white dark:bg-[#181B22]/60 rounded-2xl shadow-md hover:shadow-xl border border-gray-100 dark:border-[#2E3543] transition-all duration-300 overflow-hidden"
      >
        <Link to={`/property/${property.id}`} className="flex flex-col md:flex-row">
          <div className="md:w-72 h-56 relative overflow-hidden bg-gray-100 dark:bg-[#0F1116]">
            <img
              src={property.mainPhoto || property.image || property.photos?.[0]?.photoUrl || property.photos?.[0]?.photo_url || property.photos?.[0]?.thumbnailUrl || property.photos?.[0]?.url || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80'}
              alt={property.title}
              className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
            />
            <button
              onClick={handleFavoriteClick}
              className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-[#0F1116]/90 rounded-full shadow-md hover:shadow-lg transition-all"
            >
              {isFavorite ? (
                <FaHeart className="text-red-500" size={18} />
              ) : (
                <FaRegHeart className="text-gray-600 dark:text-gray-300" size={18} />
              )}
            </button>
            {property.is_featured && (
              <span className="absolute top-3 left-3 px-3 py-1 bg-[#C9A865] text-white text-xs font-bold rounded-lg shadow-md">
                ★ Featured
              </span>
            )}
            {property.is_verified && (
              <span className="absolute bottom-3 left-3 px-2.5 py-1 bg-[#2E7D4F] text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-1">
                ✓ Verified
              </span>
            )}
          </div>
          <div className="flex-1 p-6">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-bold text-[#181B22] dark:text-white hover:text-[#C9A865] dark:hover:text-[#C9A865] transition-colors">
                {property.title}
              </h3>
              <div className="text-right">
                <span className="text-2xl font-bold text-[#181B22] dark:text-[#C9A865]">
                  <span className="text-sm font-semibold text-[#C9A865] mr-1">ETB</span>
                  {property.price?.toLocaleString()}
                </span>
                <span className="text-gray-500 dark:text-gray-400 text-sm">/{property.period || 'month'}</span>
              </div>
            </div>

            <div className="flex items-center text-gray-500 dark:text-gray-400 mb-4">
              <FaMapMarkerAlt className="mr-1 text-[#C9A865]" size={14} />
              <span className="text-sm">{property.location?.city || property.location}, Ethiopia</span>
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{property.description}</p>

            <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-300">
              {property.bedrooms > 0 && (
                <div className="flex items-center">
                  <FaBed className="mr-1 text-[#C9A865]" size={16} />
                  <span className="text-sm font-medium">{property.bedrooms} beds</span>
                </div>
              )}
              {property.bathrooms > 0 && (
                <div className="flex items-center">
                  <FaBath className="mr-1 text-[#C9A865]" size={16} />
                  <span className="text-sm font-medium">{property.bathrooms} baths</span>
                </div>
              )}
              {property.sqft > 0 && (
                <div className="flex items-center">
                  <FaRuler className="mr-1 text-[#C9A865]" size={16} />
                  <span className="text-sm font-medium">{property.sqft} sqft</span>
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
      className="group bg-white dark:bg-[#181B22]/60 rounded-2xl shadow-md hover:shadow-2xl border border-gray-100 dark:border-[#2E3543] transition-all duration-300 overflow-hidden"
    >
      <Link to={`/property/${property.id}`}>
        <div className="relative h-56 overflow-hidden bg-gray-100 dark:bg-[#0F1116]">
          <img
            src={property.mainPhoto || property.image || property.photos?.[0]?.photoUrl || property.photos?.[0]?.photo_url || property.photos?.[0]?.thumbnailUrl || property.photos?.[0]?.url || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80'}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <button
            onClick={handleFavoriteClick}
            className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-[#0F1116]/90 rounded-full shadow-md hover:shadow-lg transition-all opacity-0 group-hover:opacity-100"
          >
            {isFavorite ? (
              <FaHeart className="text-red-500" size={16} />
            ) : (
              <FaRegHeart className="text-gray-600 dark:text-gray-300" size={16} />
            )}
          </button>
          {property.is_featured && (
            <span className="absolute top-3 left-3 px-3 py-1 bg-[#C9A865] text-white text-xs font-bold rounded-lg shadow-md">
              ★ Featured
            </span>
          )}
          {property.is_verified && (
            <span className="absolute bottom-3 left-3 px-2.5 py-1 bg-[#2E7D4F] text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-1">
              ✓ Verified
            </span>
          )}
          {property.discount && (
            <span className="absolute bottom-3 right-3 px-2.5 py-1 bg-red-600 text-white text-xs font-bold rounded-lg shadow-md">
              -{property.discount}% OFF
            </span>
          )}
        </div>

        <div className="p-5">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-[#181B22] dark:text-white group-hover:text-[#C9A865] dark:group-hover:text-[#C9A865] transition-colors line-clamp-1 text-base">
              {property.title}
            </h3>
            <div className="text-right shrink-0 ml-2">
              <span className="text-lg font-bold text-[#181B22] dark:text-[#C9A865]">
                <span className="text-xs font-semibold text-[#C9A865] mr-0.5">ETB</span>
                {property.price?.toLocaleString()}
              </span>
              <span className="text-gray-500 dark:text-gray-400 text-xs">/{property.period || 'month'}</span>
            </div>
          </div>

          <div className="flex items-center text-gray-500 dark:text-gray-400 mb-3">
            <FaMapMarkerAlt className="mr-1 text-[#C9A865]" size={12} />
            <span className="text-xs">{property.location?.city || property.location}</span>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-[#2E3543]">
            <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-300 font-medium">
              {property.bedrooms > 0 && (
                <div className="flex items-center">
                  <FaBed className="mr-1 text-[#C9A865]" size={12} />
                  <span className="text-xs">{property.bedrooms}</span>
                </div>
              )}
              {property.bathrooms > 0 && (
                <div className="flex items-center">
                  <FaBath className="mr-1 text-[#C9A865]" size={12} />
                  <span className="text-xs">{property.bathrooms}</span>
                </div>
              )}
              {property.sqft > 0 && (
                <div className="flex items-center">
                  <FaRuler className="mr-1 text-[#C9A865]" size={12} />
                  <span className="text-xs">{property.sqft}</span>
                </div>
              )}
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              {property.created_at && new Date(property.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default PropertyCard;