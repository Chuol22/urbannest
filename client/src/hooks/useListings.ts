// client/src/hooks/useListings.ts
import { useState, useCallback } from 'react';

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  type: 'rent' | 'sale';
  listingType: 'normal' | 'featured';
  images: string[];
  userId: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface CreateListingData {
  title: string;
  description: string;
  price: number;
  location: string;
  type: 'rent' | 'sale';
  images?: string[];
}

export const useListings = (userId: string) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [freeListingsCount, setFreeListingsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createListing = useCallback(async (
    listingData: CreateListingData, 
    listingType: 'normal' | 'featured'
  ): Promise<Listing | null> => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate required fields
      if (!listingData.title || !listingData.description || !listingData.price || !listingData.location) {
        throw new Error('Please fill in all required fields');
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newListing: Listing = {
        id: Date.now().toString(),
        ...listingData,
        listingType,
        userId,
        createdAt: new Date(),
        expiresAt: listingType === 'featured' 
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days for featured
          : undefined,
        images: listingData.images || []
      };
      
      setListings(prev => [...prev, newListing]);
      
      // Update free listings count if it's a normal listing
      if (listingType === 'normal') {
        setFreeListingsCount(prev => prev + 1);
      }
      
      return newListing;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create listing');
      console.error('Create listing error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const updateListing = useCallback(async (id: string, updates: Partial<Listing>): Promise<void> => {
    setLoading(true);
    try {
      setListings(prev => 
        prev.map(listing => 
          listing.id === id ? { ...listing, ...updates } : listing
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update listing');
      console.error('Update listing error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteListing = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    try {
      const listingToDelete = listings.find(l => l.id === id);
      if (listingToDelete?.listingType === 'normal') {
        setFreeListingsCount(prev => Math.max(0, prev - 1));
      }
      setListings(prev => prev.filter(listing => listing.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete listing');
      console.error('Delete listing error:', err);
    } finally {
      setLoading(false);
    }
  }, [listings]);

  const getUserListings = useCallback((): Listing[] => {
    return listings.filter(listing => listing.userId === userId);
  }, [listings, userId]);

  const getListingById = useCallback((id: string): Listing | undefined => {
    return listings.find(listing => listing.id === id);
  }, [listings]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    listings,
    freeListingsCount,
    loading,
    error,
    createListing,
    updateListing,
    deleteListing,
    getUserListings,
    getListingById,
    clearError
  };
};

export default useListings;