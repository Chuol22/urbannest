import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Alert type="error" title="Error" message={error || 'Property not found'} />
        <div className="text-center mt-8">
          <Link to="/properties">
            <Button variant="primary">Browse Other Properties</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center text-gray-600 hover:text-primary-600 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>

        {/* Image Gallery */}
        <div className="mb-8">
          <div className="relative h-96 rounded-xl overflow-hidden bg-gray-100">
            <img
              src={property.images?.[selectedImage] || '/placeholder-property.jpg'}
              alt={property.title}
              className="w-full h-full object-cover"
            />
            
            {/* Favorite Button */}
            <button
              onClick={handleFavoriteToggle}
              className="absolute top-4 right-4 bg-white p-3 rounded-full shadow-lg hover:shadow-xl transition-shadow"
            >
              <svg
                className={`w-6 h-6 ${isFav ? 'text-red-500 fill-current' : 'text-gray-400'}`}
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
              </svg>
            </button>

            {/* Available Badge */}
            {property.isAvailable ? (
              <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                Available Now
              </div>
            ) : (
              <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                Rented
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {property.images && property.images.length > 1 && (
            <div className="flex space-x-2 mt-4 overflow-x-auto pb-2">
              {property.images.map((image: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`
                    flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all
                    ${selectedImage === index
                      ? 'border-primary-600 opacity-100'
                      : 'border-gray-200 opacity-70 hover:opacity-100'
                    }
                  `}
                >
                  <img src={image} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Property Details */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>
            
            <div className="flex items-center text-gray-600 mb-4">
              <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{property.location}</span>
            </div>

            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center text-gray-700">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>{property.bedrooms} beds</span>
              </div>
              <div className="flex items-center text-gray-700">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <span>{property.bathrooms} baths</span>
              </div>
              <div className="flex items-center text-gray-700">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                <span>{formatArea(property.area)}</span>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Description</h2>
              <p className="text-gray-600 leading-relaxed">{property.description}</p>
            </div>

            {property.amenities && property.amenities.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {property.amenities.map((amenity: string, index: number) => (
                    <div key={index} className="flex items-center text-gray-600">
                      <svg className="w-5 h-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <div className="bg-gray-50 rounded-lg p-6 sticky top-24">
              <div className="mb-4">
                <span className="text-3xl font-bold text-primary-600">
                  {formatPrice(property.price)}
                </span>
                <span className="text-gray-600">/month</span>
              </div>

              <Button
                variant="primary"
                fullWidth
                onClick={handleContact}
                disabled={!property.isAvailable}
                className="mb-3"
              >
                {property.isAvailable ? 'Contact Landlord' : 'Not Available'}
              </Button>

              <hr className="my-4" />

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Landlord Information</h3>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-semibold text-lg">
                      {property.landlord?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{property.landlord?.name || 'UrbanNEST'}</p>
                    <p className="text-sm text-gray-500">Property Owner</p>
                  </div>
                </div>
                
                <button
                  onClick={handleContact}
                  className="w-full text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Message Landlord
                </button>
              </div>

              <hr className="my-4" />

              <div className="space-y-2">
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}