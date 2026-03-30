export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const APP_NAME = 'UrbanNEST';
export const APP_VERSION = '1.0.0';

export const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'condo', label: 'Condo' },
  { value: 'studio', label: 'Studio' },
  { value: 'townhouse', label: 'Townhouse' },
] as const;

export const PRICE_RANGES = [
  { label: 'Any Price', min: 0, max: Infinity },
  { label: '$0 - $1,000', min: 0, max: 1000 },
  { label: '$1,000 - $2,000', min: 1000, max: 2000 },
  { label: '$2,000 - $3,000', min: 2000, max: 3000 },
  { label: '$3,000+', min: 3000, max: Infinity },
];

export const BEDROOMS = [1, 2, 3, 4, 5];
export const BATHROOMS = [1, 2, 3, 4];

export const AMENITIES = [
  'Air Conditioning',
  'Heating',
  'Parking',
  'Pool',
  'Gym',
  'Pet Friendly',
  'Washer/Dryer',
  'Dishwasher',
  'Balcony',
  'Furnished',
] as const;