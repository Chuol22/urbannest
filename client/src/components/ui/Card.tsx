// src/components/ui/Card.tsx
import { Link } from 'react-router-dom';
import { formatCurrency, formatAddress, formatRelativeTime } from '../../utils/formatters';

interface CardProps {
  id: string;
  title: string;
  price: number;
  address: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  imageUrl?: string;
  createdAt?: string;
  status?: 'available' | 'rented' | 'pending';
  onFavorite?: (id: string) => void;
  isFavorite?: boolean;
}

export default function Card({
  id,
  title,
  price,
  address,
  bedrooms,
  bathrooms,
  squareFeet,
  imageUrl = '/images/placeholder-property.jpg',
  createdAt,
  status = 'available',
  onFavorite,
  isFavorite = false
}: CardProps) {
  const statusColors = {
    available: 'bg-green-100 text-green-800',
    rented: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800'
  };

  const statusText = {
    available: 'Available',
    rented: 'Rented',
    pending: 'Pending'
  };

  return (
    <div className="card group">
      <Link to={`/properties/${id}`}>
        <div className="relative">
          <img
            src={imageUrl}
            alt={title}
            className="card-image"
            onError={(e) => {
              e.currentTarget.src = '/images/placeholder-property.jpg';
            }}
          />
          <span className={`card-status ${statusColors[status]}`}>
            {statusText[status]}
          </span>
          {onFavorite && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onFavorite(id);
              }}
              className="card-favorite-btn"
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              {isFavorite ? '❤️' : '🤍'}
            </button>
          )}
        </div>
        
        <div className="card-content">
          <h3 className="card-title">{title}</h3>
          <p className="card-price">{formatCurrency(price)}<span className="text-sm text-gray-500">/month</span></p>
          <p className="card-address">{formatAddress(address)}</p>
          
          <div className="card-features">
            {bedrooms && (
              <span className="feature">
                <span className="feature-icon">🛏️</span>
                {bedrooms} {bedrooms === 1 ? 'Bed' : 'Beds'}
              </span>
            )}
            {bathrooms && (
              <span className="feature">
                <span className="feature-icon">🚿</span>
                {bathrooms} {bathrooms === 1 ? 'Bath' : 'Baths'}
              </span>
            )}
            {squareFeet && (
              <span className="feature">
                <span className="feature-icon">📐</span>
                {(squareFeet ?? 0).toLocaleString()} sqft
              </span>
            )}
          </div>
          
          {createdAt && (
            <p className="card-date">
              Listed {formatRelativeTime(createdAt)}
            </p>
          )}
        </div>
      </Link>
    </div>
  );
}