// client/src/components/PropertyImage.tsx

import { useState } from 'react';

interface Photo {
  photoUrl?: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
  responsive?: {
    srcset?: string;
    thumbnail?: string;
    medium?: string;
    large?: string;
  };
  id?: string;
}

interface PropertyImageProps {
  photo: Photo;
  alt?: string;
  className?: string;
  sizes?: string;
  lazyLoad?: boolean;
}

/**
 * Responsive property image with lazy loading and fallback
 */
const PropertyImage = ({ 
  photo, 
  alt = '', 
  className = '',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  lazyLoad = true 
}: PropertyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  // Use Cloudinary URLs if available
  const mediumUrl = photo.mediumUrl || photo.responsive?.medium;
  const largeUrl = photo.photoUrl || photo.responsive?.large;
  const srcset = photo.responsive?.srcset;
  
  // Fallback image
  const fallbackUrl = '/images/placeholder-property.jpg';
  
  const handleLoad = () => setIsLoaded(true);
  const handleError = () => setError(true);
  
  if (error) {
    return (
      <img 
        src={fallbackUrl}
        alt={alt}
        className={className}
        loading={lazyLoad ? 'lazy' : 'eager'}
      />
    );
  }
  
  return (
    <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
      {/* Blur-up placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-gray-200" />
      )}
      
      {/* Responsive image */}
      <img
        src={mediumUrl || largeUrl}
        srcSet={srcset}
        sizes={sizes}
        alt={alt}
        className={`
          w-full h-full object-cover transition-opacity duration-300
          ${isLoaded ? 'opacity-100' : 'opacity-0'}
        `}
        loading={lazyLoad ? 'lazy' : 'eager'}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
};

export default PropertyImage;

// Gallery component for multiple images
interface PropertyGalleryProps {
  photos: Photo[];
  onPhotoClick?: (index: number) => void;
}

export const PropertyGallery = ({ photos, onPhotoClick }: PropertyGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  if (!photos || photos.length === 0) {
    return (
      <div className="bg-gray-200 h-96 flex items-center justify-center">
        <span className="text-gray-500">No images available</span>
      </div>
    );
  }
  
  const mainPhoto = photos[selectedIndex];
  const thumbnails = photos.slice(0, 5);
  
  return (
    <div className="space-y-4">
      {/* Main image */}
      <div 
        className="relative cursor-pointer rounded-lg overflow-hidden"
        onClick={() => onPhotoClick?.(selectedIndex)}
      >
        <PropertyImage 
          photo={mainPhoto}
          alt={`Property image ${selectedIndex + 1}`}
          className="h-96"
          sizes="100vw"
        />
      </div>
      
      {/* Thumbnail strip */}
      {photos.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {thumbnails.map((photo, index) => (
            <button
              key={photo.id || index}
              onClick={() => setSelectedIndex(index)}
              className={`
                relative rounded-md overflow-hidden h-20
                ${selectedIndex === index ? 'ring-2 ring-blue-500' : ''}
              `}
            >
              <PropertyImage
                photo={photo}
                alt={`Thumbnail ${index + 1}`}
                className="h-full w-full"
                sizes="100px"
              />
            </button>
          ))}
          
          {photos.length > 5 && (
            <button
              onClick={() => onPhotoClick?.(4)}
              className="relative bg-black/50 rounded-md overflow-hidden h-20 flex items-center justify-center text-white text-sm font-medium"
            >
              +{photos.length - 4} more
            </button>
          )}
        </div>
      )}
    </div>
  );
};