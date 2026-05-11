import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProperties } from '../hooks/useProperties';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Loader } from '../components/ui/Loader';
import { Alert } from '../components/ui/Alert';
import { formatPrice, formatArea } from '../utils/helpers';

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getPropertyById, addToFavorites, removeFromFavorites, isFavorite } = useProperties();
  const { isLoggedIn } = useAuth();
  
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    if (id) {
      loadProperty();
    }
  }, [id]);

  useEffect(() => {
    if (property) {
      setIsFav(isFavorite(property.id));
    }
  }, [property, isFavorite]);

  const loadProperty = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPropertyById(id!);
      if (data) {
        setProperty(data);
      } else {
        setError('Property not found');
      }
    } catch (err) {
      setError('Failed to load property details');
      console.error('Error loading property:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteToggle = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    try {
      if (isFav) {
        await removeFromFavorites(property.id);
        setIsFav(false);
      } else {
        await addToFavorites(property.id);
        setIsFav(true);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const handleContact = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    // Open contact modal or navigate to contact page
    navigate('/contact');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader size="lg" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 150, damping: 12 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
      >
        <Alert type="error" title="Error" message={error || 'Property not found'} />
        <div className="text-center mt-8">
          <Link to="/properties">
            <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}>
              <Button variant="primary" className="bg-amber-600 hover:bg-amber-700 text-white shadow-xl shadow-amber-600/30">Browse Other Properties</Button>
            </motion.div>
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 100, damping: 15 }}
          whileHover={{ x: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center text-gray-600 hover:text-amber-600 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </motion.button>

        {/* Image Gallery */}
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 100, damping: 15 }}
          className="mb-8"
        >
          <div className="relative h-96 rounded-xl overflow-hidden bg-gray-100">
            <motion.img
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              src={property.images?.[selectedImage] || '/placeholder-property.jpg'}
              alt={property.title}
              className="w-full h-full object-cover"
            />
            
            {/* Favorite Button */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 10 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleFavoriteToggle}
              className="absolute top-4 right-4 bg-white p-3 rounded-full shadow-lg hover:shadow-xl transition-shadow"
            >
              <motion.svg
                animate={isFav ? { scale: [1, 1.2, 1] } : {}}
                transition={{ repeat: isFav ? Infinity : 0, duration: 0.5 }}
                className={`w-6 h-6 ${isFav ? 'text-amber-600 fill-current' : 'text-gray-400'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </motion.svg>
            </motion.button>

            {/* Available Badge */}
            {property.isAvailable ? (
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 100, damping: 15 }}
                className="absolute top-4 left-4 bg-amber-600 text-white px-3 py-1 rounded-full text-sm font-semibold"
              >
                Available Now
              </motion.div>
            ) : (
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 100, damping: 15 }}
                className="absolute top-4 left-4 bg-gray-600 text-white px-3 py-1 rounded-full text-sm font-semibold"
              >
                Rented
              </motion.div>
            )}
          </div>

          {/* Thumbnails */}
          {property.images && property.images.length > 1 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 100, damping: 15 }}
              className="flex space-x-2 mt-4 overflow-x-auto pb-2"
            >
              {property.images.map((image: string, index: number) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1, type: "spring", stiffness: 150, damping: 12 }}
                  whileHover={{ scale: 1.1, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedImage(index)}
                  className={`
                    flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all
                    ${selectedImage === index
                      ? 'border-amber-600 opacity-100'
                      : 'border-gray-200 opacity-70 hover:opacity-100'
                    }
                  `}
                >
                  <img src={image} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                </motion.button>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Property Details */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6, type: "spring", stiffness: 100, damping: 15 }}
            className="lg:col-span-2"
          >
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 100, damping: 15 }}
              className="text-3xl font-bold text-gray-900 mb-2"
            >
              {property.title}
            </motion.h1>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center text-gray-600 mb-4"
            >
              <svg className="w-5 h-5 mr-1 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{property.location}</span>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 100, damping: 15 }}
              className="flex flex-wrap gap-4 mb-6"
            >
              <motion.div 
                whileHover={{ y: -2, scale: 1.05 }}
                className="flex items-center text-gray-700"
              >
                <svg className="w-5 h-5 mr-2 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>{property.bedrooms} beds</span>
              </motion.div>
              <motion.div 
                whileHover={{ y: -2, scale: 1.05 }}
                className="flex items-center text-gray-700"
              >
                <svg className="w-5 h-5 mr-2 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <span>{property.bathrooms} baths</span>
              </motion.div>
              <motion.div 
                whileHover={{ y: -2, scale: 1.05 }}
                className="flex items-center text-gray-700"
              >
                <svg className="w-5 h-5 mr-2 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                <span>{formatArea(property.area)}</span>
              </motion.div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, type: "spring", stiffness: 100, damping: 15 }}
              className="mb-8"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Description</h2>
              <p className="text-gray-600 leading-relaxed">{property.description}</p>
            </motion.div>

            {property.amenities && property.amenities.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, type: "spring", stiffness: 100, damping: 15 }}
                className="mb-8"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {property.amenities.map((amenity: string, index: number) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + index * 0.05, type: "spring", stiffness: 100, damping: 15 }}
                      whileHover={{ x: 5 }}
                      className="flex items-center text-gray-600"
                    >
                      <svg className="w-5 h-5 mr-2 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{amenity}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Sidebar */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.6, type: "spring", stiffness: 100, damping: 15 }}
          >
            <motion.div 
              whileHover={{ y: -4 }}
              className="bg-gray-50 rounded-2xl p-6 sticky top-24 shadow-lg border-b-4 border-amber-600"
            >
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, type: "spring", stiffness: 100, damping: 15 }}
                className="mb-4"
              >
                <span className="text-3xl font-bold text-gray-900">
                  {formatPrice(property.price)}
                </span>
                <span className="text-gray-600">/month</span>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleContact}
                  disabled={!property.isAvailable}
                  className="mb-3 bg-amber-600 hover:bg-amber-700 text-white shadow-xl shadow-amber-600/30"
                >
                  {property.isAvailable ? 'Contact Landlord' : 'Not Available'}
                </Button>
              </motion.div>

              <hr className="my-4" />

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="space-y-3"
              >
                <h3 className="font-semibold text-gray-900">Landlord Information</h3>
                <motion.div 
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="flex items-center space-x-3"
                >
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <span className="text-amber-600 font-semibold text-lg">
                      {property.landlord?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{property.landlord?.name || 'UrbanNEST'}</p>
                    <p className="text-sm text-gray-500">Property Owner</p>
                  </div>
                </motion.div>
                
                <motion.button
                  whileHover={{ x: 5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleContact}
                  className="w-full text-amber-600 hover:text-amber-700 text-sm font-medium"
                >
                  Message Landlord
                </motion.button>
              </motion.div>

              <hr className="my-4" />

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="space-y-2"
              >
                <h3 className="font-semibold text-gray-900">Property Details</h3>
                <div className="space-y-1 text-sm">
                  <p className="flex justify-between">
                    <span className="text-gray-600">Property Type:</span>
                    <span className="text-gray-900 capitalize">{property.type}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-600">Listed:</span>
                    <span className="text-gray-900">
                      {new Date(property.createdAt).toLocaleDateString()}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-600">Property ID:</span>
                    <span className="text-gray-900">#{property.id.slice(0, 8)}</span>
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}