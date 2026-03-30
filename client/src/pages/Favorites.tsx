import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PropertyCard } from '../components/property/PropertyCard';
import { Button } from '../components/ui/Button';
import { Loader } from '../components/ui/Loader';
import { useProperties } from '../hooks/useProperties';
import { useAuth } from '../hooks/useAuth';

export default function Favorites() {
  const { isLoggedIn } = useAuth();
  const { favorites, properties, loading, removeFromFavorites, getFavorites } = useProperties();
  const [favoriteProperties, setFavoriteProperties] = useState<any[]>([]);

  useEffect(() => {
    if (isLoggedIn) {
      getFavorites();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    // Filter properties that are in favorites
    const favProps = properties.filter(prop => favorites.includes(prop.id));
    setFavoriteProperties(favProps);
  }, [properties, favorites]);

  const handleRemoveFavorite = async (propertyId: string) => {
    await removeFromFavorites(propertyId);
    setFavoriteProperties(prev => prev.filter(p => p.id !== propertyId));
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="text-6xl mb-4">❤️</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Save Your Favorite Properties</h1>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Sign in to save properties you love and keep track of your favorites.
        </p>
        <Link to="/login">
          <Button variant="primary">Sign In to Continue</Button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Favorites</h1>
        <p className="text-gray-600">
          {favoriteProperties.length} {favoriteProperties.length === 1 ? 'property' : 'properties'} saved
        </p>
      </div>

      {/* Favorite Properties Grid */}
      {favoriteProperties.length > 0 ? (
        <AnimatePresence>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteProperties.map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <PropertyCard
                  property={property}
                  onFavoriteToggle={() => handleRemoveFavorite(property.id)}
                />
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      ) : (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">❤️</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">No favorites yet</h2>
          <p className="text-gray-600 mb-6">
            Start exploring properties and save your favorites here.
          </p>
          <Link to="/properties">
            <Button variant="primary">Browse Properties</Button>
          </Link>
        </div>
      )}
    </div>
  );
}