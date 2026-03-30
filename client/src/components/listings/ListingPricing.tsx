import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, Star, TrendingUp } from 'lucide-react';
import { LISTING_PRICES, formatPrice } from '../../utils/pricing';
import { Button } from '../ui/Button';

interface ListingPricingProps {
  onSelect: (type: 'normal' | 'featured', price: number) => void;
  userFreeListingsLeft: number;
  isAgent?: boolean;
}

const ListingPricing: React.FC<ListingPricingProps> = ({
  onSelect,
  userFreeListingsLeft,
  isAgent = false
}) => {
  const [selectedType, setSelectedType] = useState<'normal' | 'featured' | null>(null);

  const handleSelect = (type: 'normal' | 'featured') => {
    const price = type === 'normal' ? 0 : LISTING_PRICES.featured.price;
    setSelectedType(type);
    onSelect(type, price);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-900">Choose Listing Type</h3>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Free Listing */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className={`relative p-6 rounded-2xl border-2 transition-all cursor-pointer ${
            selectedType === 'normal'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 hover:border-green-300'
          }`}
          onClick={() => handleSelect('normal')}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="text-xl font-bold text-gray-900">Normal Listing</h4>
              <p className="text-3xl font-bold text-green-600 mt-2">FREE</p>
            </div>
            <div className="bg-green-100 p-2 rounded-full">
              <Check className="text-green-600" size={24} />
            </div>
          </div>
          
          <ul className="space-y-2 mb-4">
            <li className="flex items-center gap-2 text-gray-600">
              <Check size={16} className="text-green-500" />
              <span>Standard placement</span>
            </li>
            <li className="flex items-center gap-2 text-gray-600">
              <Check size={16} className="text-green-500" />
              <span>Basic visibility</span>
            </li>
            <li className="flex items-center gap-2 text-gray-600">
              <Check size={16} className="text-green-500" />
              <span>Valid indefinitely</span>
            </li>
          </ul>
          
          {!isAgent && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Free listings remaining: <span className="font-bold text-green-600">{userFreeListingsLeft}/10</span>
              </p>
            </div>
          )}
        </motion.div>

        {/* Featured Listing */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className={`relative p-6 rounded-2xl border-2 transition-all cursor-pointer ${
            selectedType === 'featured'
              ? 'border-yellow-500 bg-yellow-50'
              : 'border-gray-200 hover:border-yellow-300'
          }`}
          onClick={() => handleSelect('featured')}
        >
          <div className="absolute -top-3 right-6">
            <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
              <Star size={14} />
              <span>POPULAR</span>
            </div>
          </div>
          
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="text-xl font-bold text-gray-900">Featured Listing</h4>
              <p className="text-3xl font-bold text-yellow-600 mt-2">
                {formatPrice(LISTING_PRICES.featured.price)}
                <span className="text-sm text-gray-500">/7 days</span>
              </p>
            </div>
            <div className="bg-yellow-100 p-2 rounded-full">
              <Star className="text-yellow-600" size={24} />
            </div>
          </div>
          
          <ul className="space-y-2 mb-4">
            <li className="flex items-center gap-2 text-gray-600">
              <Check size={16} className="text-yellow-500" />
              <span>Premium placement</span>
            </li>
            <li className="flex items-center gap-2 text-gray-600">
              <Check size={16} className="text-yellow-500" />
              <span>Featured badge</span>
            </li>
            <li className="flex items-center gap-2 text-gray-600">
              <Check size={16} className="text-yellow-500" />
              <span>Priority visibility</span>
            </li>
            <li className="flex items-center gap-2 text-gray-600">
              <Check size={16} className="text-yellow-500" />
              <span>7-day promotion</span>
            </li>
          </ul>
          
          <p className="text-sm text-yellow-600 mt-2">
            Get 3x more views with featured listing!
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default ListingPricing;