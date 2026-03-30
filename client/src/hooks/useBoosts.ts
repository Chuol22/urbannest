// client/src/hooks/useBoosts.ts
import { useState, useCallback } from 'react';

export type BoostType = 'top_search' | 'urgent_badge';

export interface Boost {
  id: string;
  type: BoostType;
  listingId: string;
  price: number;
  appliedAt: Date;
  expiresAt: Date;
  active: boolean;
}

export interface BoostDetails {
  type: BoostType;
  name: string;
  description: string;
  price: number;
  duration: number; // in days
  icon: string;
}

export const boostOptions: BoostDetails[] = [
  {
    type: 'top_search',
    name: 'Top of Search',
    description: 'Your listing appears at the top of search results',
    price: 299,
    duration: 7,
    icon: '🔝'
  },
  {
    type: 'urgent_badge',
    name: 'Urgent Badge',
    description: 'Get attention with an "Urgent" badge on your listing',
    price: 199,
    duration: 7,
    icon: '⚠️'
  }
];

export const useBoosts = () => {
  const [activeBoosts, setActiveBoosts] = useState<Boost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyBoost = useCallback(async (
    listingId: string, 
    boostType: BoostType, 
    price: number
  ): Promise<Boost | null> => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate listingId
      if (!listingId) {
        throw new Error('Listing ID is required');
      }

      // Check if boost already applied
      const existingBoost = activeBoosts.find(
        b => b.listingId === listingId && b.type === boostType && b.active
      );
      
      if (existingBoost) {
        throw new Error(`This listing already has an active ${boostType} boost`);
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newBoost: Boost = {
        id: Date.now().toString(),
        type: boostType,
        listingId,
        price,
        appliedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        active: true
      };
      
      setActiveBoosts(prev => [...prev, newBoost]);
      return newBoost;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply boost');
      console.error('Apply boost error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [activeBoosts]);

  const getBoostsForListing = useCallback((listingId: string): Boost[] => {
    return activeBoosts.filter(
      boost => boost.listingId === listingId && boost.active
    );
  }, [activeBoosts]);

  const removeBoost = useCallback(async (
    listingId: string, 
    boostType: BoostType
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setActiveBoosts(prev => 
        prev.map(boost => 
          boost.listingId === listingId && boost.type === boostType 
            ? { ...boost, active: false } 
            : boost
        )
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove boost');
      console.error('Remove boost error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getBoostDetails = useCallback((boostType: BoostType): BoostDetails | undefined => {
    return boostOptions.find(option => option.type === boostType);
  }, []);

  const getTotalBoostCost = useCallback((boosts: BoostType[]): number => {
    return boosts.reduce((total, boostType) => {
      const details = getBoostDetails(boostType);
      return total + (details?.price || 0);
    }, 0);
  }, [getBoostDetails]);

  const isBoostActive = useCallback((listingId: string, boostType: BoostType): boolean => {
    return activeBoosts.some(
      boost => boost.listingId === listingId && boost.type === boostType && boost.active
    );
  }, [activeBoosts]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    activeBoosts,
    loading,
    error,
    applyBoost,
    getBoostsForListing,
    removeBoost,
    getBoostDetails,
    getTotalBoostCost,
    isBoostActive,
    clearError,
    availableBoosts: boostOptions
  };
};

export default useBoosts;