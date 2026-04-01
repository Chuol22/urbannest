// src/components/boosts/BoostOptions.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertCircle, Zap, Check, Shield } from 'lucide-react';
import { BOOST_PRICES, formatPrice } from '../../utils/pricing';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';

interface BoostOptionsProps {
  listingId: string;
  onApplyBoost: (listingId: string, boostType: 'top_search' | 'urgent_badge', price: number) => Promise<void>;
  existingBoosts?: Array<'top_search' | 'urgent_badge'>;
  isProcessing?: boolean;
}

const BoostOptions: React.FC<BoostOptionsProps> = ({
  listingId,
  onApplyBoost,
  existingBoosts = [],
  isProcessing = false
}) => {
  const [selectedBoost, setSelectedBoost] = useState<'top_search' | 'urgent_badge' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const boosts = [
    {
      id: 'top_search' as const,
      icon: TrendingUp,
      ...BOOST_PRICES.top_search,
      securityNote: 'Your listing will appear at the top of search results for 30 days'
    },
    {
      id: 'urgent_badge' as const,
      icon: AlertCircle,
      ...BOOST_PRICES.urgent_badge,
      securityNote: 'An "URGENT" badge will be displayed on your listing'
    }
  ];

  const handleApplyBoost = async () => {
    if (!selectedBoost) return;
    
    setError(null);
    setIsLoading(true);
    
    try {
      const boost = boosts.find(b => b.id === selectedBoost);
      if (boost) {
        await onApplyBoost(listingId, selectedBoost, boost.price);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to apply boost. Please try again.';
      setError(errorMessage);
      console.error('Boost application error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const isBoostActive = (boostId: 'top_search' | 'urgent_badge') => {
    return existingBoosts.includes(boostId);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Boost Your Listing</h3>
        <p className="text-gray-600">Get more visibility and sell faster</p>
      </div>

      {error && (
        <Alert 
          type="error" 
          message={error} 
          onClose={() => setError(null)}
        />
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {boosts.map((boost) => {
          const Icon = boost.icon;
          const isActive = isBoostActive(boost.id);
          
          return (
            <motion.div
              key={boost.id}
              whileHover={{ scale: 1.02 }}
              className={`relative p-6 rounded-2xl border-2 transition-all cursor-pointer ${
                selectedBoost === boost.id
                  ? `${boost.color} border-opacity-50 bg-opacity-10`
                  : 'border-gray-200 hover:border-gray-300'
              } ${isActive ? 'opacity-75 cursor-not-allowed' : ''}`}
              style={{
                backgroundColor: selectedBoost === boost.id ? `${boost.color}10` : 'transparent'
              }}
              onClick={() => !isActive && !isLoading && !isProcessing && setSelectedBoost(boost.id)}
            >
              {isActive && (
                <div className="absolute top-4 right-4">
                  <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <Check size={12} />
                    <span>ACTIVE</span>
                  </div>
                </div>
              )}
              
              <div className={`${boost.color} bg-opacity-20 w-12 h-12 rounded-full flex items-center justify-center mb-4`}>
                <Icon size={24} className={boost.color.replace('bg-', 'text-')} />
              </div>
              
              <h4 className="text-xl font-bold text-gray-900 mb-2">{boost.label}</h4>
              <p className="text-3xl font-bold text-gray-900 mb-2">
                {formatPrice(boost.price)}
              </p>
              <p className="text-gray-600 text-sm mb-4">{boost.description}</p>
              <p className="text-xs text-gray-500">Valid for {boost.duration}</p>
              
              {!isActive && (
                <div className="mt-4 space-y-2">
                  <div className="text-sm text-green-600 font-semibold">
                    Estimated: +50% more views
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Shield size={12} />
                    <span>{boost.securityNote}</span>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {selectedBoost && !isBoostActive(selectedBoost) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-gray-50 rounded-lg"
        >
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <p className="font-semibold text-gray-900">Selected Boost</p>
              <p className="text-sm text-gray-600">
                {boosts.find(b => b.id === selectedBoost)?.label}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Payment will be processed securely
              </p>
            </div>
            <Button 
              onClick={handleApplyBoost} 
              loading={isLoading || isProcessing}
              disabled={isLoading || isProcessing}
              className="bg-gradient-to-r from-purple-500 to-purple-600"
            >
              {isLoading ? 'Processing...' : `Apply Boost - ${formatPrice(boosts.find(b => b.id === selectedBoost)?.price || 0)}`}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default BoostOptions;