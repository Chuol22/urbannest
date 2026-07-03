// src/pages/Favorites.tsx
import React, { useState, useEffect } from 'react';
import PropertyCard from '../components/property/PropertyCard';
import { useAuth } from '../context/AuthContext';
import { Heart } from 'lucide-react';

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your favorites...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to view favorites</h2>
          <p className="text-gray-600 mb-6">
            Please sign in to see your saved properties and manage your favorites.
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No favorites yet</h2>
          <p className="text-gray-600 mb-6">
            Start exploring properties and save your favorites to see them here.
          </p>
          <button
            onClick={() => window.location.href = '/properties'}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Browse Properties
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Favorites</h1>
        <p className="text-gray-600">
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
              className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
            >
              <Heart size={20} className="fill-red-500 text-red-500" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Favorites;