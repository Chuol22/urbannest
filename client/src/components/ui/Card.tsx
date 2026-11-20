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
    available: 'bg-[#F0F8F3] text-[#2E7D4F] border border-[#BCE1CA] dark:bg-[#2E7D4F]/20 dark:text-[#5CAE78] dark:border-[#2E7D4F]/40',
    rented: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-400',
    pending: 'bg-[#FCFAF5] text-[#947337] border border-[#EDE2C6] dark:bg-[#C9A865]/20 dark:text-[#DFCFA0]'
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