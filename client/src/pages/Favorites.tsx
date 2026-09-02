// src/pages/Favorites.tsx

import React, { useEffect, useState } from 'react';

import { Heart } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import PropertyCard from '../components/property/PropertyCard';

interface FavoriteProperty {
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

const Favorites: React.FC = () => {
  const [favorites, setFavorites] = useState<FavoriteProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    // Load favorites from API or localStorage
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      // Replace with your actual API call
      // Sample data for demonstration
      setTimeout(() => {
        setFavorites([
          {
            id: '1',
            title: 'Modern Apartment in Bole',
            image: 'https://via.placeholder.com/400x300',
            price: 15000,
            period: 'month',
            location: 'Bole, Addis Ababa',
            type: 'Apartment',
            beds: 2,
            baths: 2,
            sqft: 1200,
          },
          {
            id: '2',
            title: 'Luxury Villa in Kazanchis',
            image: 'https://via.placeholder.com/400x300',
            price: 35000,
            period: 'month',
            location: 'Kazanchis, Addis Ababa',
            type: 'Villa',
            beds: 4,
            baths: 3,
            sqft: 2500,
          },
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading favorites:', error);
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (propertyId: string) => {
    try {
      // Replace with your actual API call
      // Update local state
      setFavorites(favorites.filter(prop => prop.id !== propertyId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 transition-colors">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your favorites...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 p-4 transition-colors">
        <div className="text-center max-w-md bg-gray-50 dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
          <Heart className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sign in to view favorites</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Please sign in to see your saved properties and manage your favorites.
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="bg-amber-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-amber-700 transition-colors shadow-lg shadow-amber-600/20"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 p-4 transition-colors">
        <div className="text-center max-w-md bg-gray-50 dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
          <Heart className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No favorites yet</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Start exploring properties and save your favorites to see them here.
          </p>
          <button
            onClick={() => window.location.href = '/properties'}
            className="bg-amber-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-amber-700 transition-colors shadow-lg shadow-amber-600/20"
          >
            Browse Properties
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Favorites</h1>
          <p className="text-gray-600 dark:text-gray-400">
            You have {favorites.length} saved {favorites.length === 1 ? 'property' : 'properties'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((property) => (
            <div key={property.id} className="relative">
              <PropertyCard
                property={property}
                onFavoriteToggle={() => handleRemoveFavorite(property.id)}
              />
              <button
                onClick={() => handleRemoveFavorite(property.id)}
                className="absolute top-4 right-4 z-10 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:shadow-lg transition-shadow"
              >
                <Heart size={20} className="fill-red-500 text-red-500" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Favorites;