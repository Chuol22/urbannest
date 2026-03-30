// client/src/hooks/useSubscription.ts
import { useState, useCallback } from 'react';

export type PlanType = 'basic' | 'pro' | 'premium';

export interface Subscription {
  id: string;
  userId: string;
  plan: PlanType;
  price: number;
  startDate: Date;
  endDate: Date;
  active: boolean;
  listingsLimit: number;
  listingsUsed: number;
}

export interface PlanDetails {
  name: PlanType;
  price: number;
  listingsLimit: number;
  features: string[];
  popular?: boolean;
}

export const plans: PlanDetails[] = [
  {
    name: 'basic',
    price: 0,
    listingsLimit: 10,
    features: [
      '10 free listings',
      'Basic support',
      '30 days validity'
    ]
  },
  {
    name: 'pro',
    price: 499,
    listingsLimit: 30,
    features: [
      '30 premium listings',
      'Priority support',
      'Featured placement',
      'Analytics dashboard'
    ],
    popular: true
  },
  {
    name: 'premium',
    price: 999,
    listingsLimit: -1, // Unlimited
    features: [
      'Unlimited listings',
      '24/7 priority support',
      'Featured placement',
      'Advanced analytics',
      'Boost discounts'
    ]
  }
];

export const useSubscription = (userId: string) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subscribe = useCallback(async (
    plan: PlanType, 
    price: number
  ): Promise<Subscription | null> => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const selectedPlan = plans.find(p => p.name === plan);
      if (!selectedPlan) {
        throw new Error('Invalid plan selected');
      }

      const newSubscription: Subscription = {
        id: Date.now().toString(),
        userId,
        plan,
        price,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        active: true,
        listingsLimit: selectedPlan.listingsLimit,
        listingsUsed: 0
      };
      
      setSubscription(newSubscription);
      return newSubscription;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to subscribe');
      console.error('Subscription error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const cancelSubscription = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setSubscription(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
      console.error('Cancel subscription error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateListingsUsed = useCallback(async (count: number): Promise<void> => {
    if (!subscription) return;
    
    setSubscription(prev => {
      if (!prev) return null;
      return {
        ...prev,
        listingsUsed: Math.min(prev.listingsUsed + count, prev.listingsLimit)
      };
    });
  }, [subscription]);

  const getRemainingListings = useCallback((): number => {
    if (!subscription) return 0;
    if (subscription.listingsLimit === -1) return Infinity;
    return Math.max(0, subscription.listingsLimit - subscription.listingsUsed);
  }, [subscription]);

  const isSubscriptionActive = useCallback((): boolean => {
    if (!subscription) return false;
    return subscription.active && new Date() < subscription.endDate;
  }, [subscription]);

  const getSubscriptionDetails = useCallback((): PlanDetails | null => {
    if (!subscription) return null;
    return plans.find(p => p.name === subscription.plan) || null;
  }, [subscription]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    subscription,
    loading,
    error,
    subscribe,
    cancelSubscription,
    updateListingsUsed,
    getRemainingListings,
    isSubscriptionActive,
    getSubscriptionDetails,
    clearError,
    availablePlans: plans
  };
};

export default useSubscription;