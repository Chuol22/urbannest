import { useState } from 'react';
import { Button } from '../ui/Button';
import { Loader } from '../ui/Loader';
import { formatPrice, formatArea } from '../../utils/helpers';

interface Property {
  id: string;
  title: string;
  description: string;
  location: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  type: string;
  images: string[];
  amenities: string[];
  isAvailable: boolean;
  landlord: {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar?: string;
  };
  createdAt: Date;
}

interface PropertyDetailsProps {
  property: Property;
  loading?: boolean;
  onContactClick?: () => void;
  onFavoriteClick?: () => void;
  onShareClick?: () => void;
  isFavorite?: boolean;
}

export const PropertyDetails: React.FC<PropertyDetailsProps> = ({
  property,
  loading = false,
  onContactClick,
  onFavoriteClick,
  onShareClick,
  isFavorite = false,
}) => {
  const [selectedImage, setSelectedImage] = useState(0);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Image Gallery */}
      <div className="relative">
        <div className="h-96 overflow-hidden">
          <img
            src={property.images[selectedImage] || '/placeholder-property.jpg'}
            alt={property.title}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Thumbnails */}
        {property.images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {property.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`
                  w-16 h-16 rounded-lg overflow-hidden border-2 transition-all
                  ${selectedImage === index
                    ? 'border-primary-600 opacity-100'
                    : 'border-white opacity-70 hover:opacity-100'
                  }
                `}
              >
                <img src={image} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex space-x-2">
          <button
            onClick={onFavoriteClick}
            className="bg-white p-2 rounded-full shadow-lg hover:shadow-xl transition-shadow"
          >
            <svg
              className={`w-6 h-6 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-400'}`}
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
          
          <button
            onClick={onShareClick}
            className="bg-white p-2 rounded-full shadow-lg hover:shadow-xl transition-shadow"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
          </button>
        </div>

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

      {/* Content */}
      <div className="p-6">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{property.title}</h1>
            
            <div className="flex items-center text-gray-600 mb-4">
              <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{property.location}</span>
            </div>

            <div className="flex items-center space-x-4 mb-6">
              <div className="flex items-center text-gray-700">
                <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>{property.bedrooms} beds</span>
              </div>
              <div className="flex items-center text-gray-700">
                <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <span>{property.bathrooms} baths</span>
              </div>
              <div className="flex items-center text-gray-700">
                <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                <span>{formatArea(property.area)}</span>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Description</h2>
              <p className="text-gray-600 leading-relaxed">{property.description}</p>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {property.amenities.map((amenity, index) => (
                  <div key={index} className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
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
                onClick={onContactClick}
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
                      {property.landlord.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{property.landlord.name}</p>
                    <p className="text-sm text-gray-500">Property Owner</p>
                  </div>
                </div>
                
                <button
                  onClick={onContactClick}
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};