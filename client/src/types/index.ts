// ==================== API Response Types ====================
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ==================== Filter & Search Types ====================
export interface FilterParams {
  search?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  location?: string;
  page?: number;
  limit?: number;
}

export interface PropertyFilters {
  search?: string;
  type?: PropertyType | 'all';
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  location?: string;
  amenities?: string[];
}

// ==================== User Types ====================
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'tenant' | 'landlord' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile extends User {
  favorites: string[];
  savedSearches: SavedSearch[];
  notifications: Notification[];
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: PropertyFilters;
  createdAt: Date;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

// ==================== Property Types ====================
export type PropertyType = 'apartment' | 'house' | 'condo' | 'studio' | 'townhouse';

export interface Property {
  id: string;
  title: string;
  description: string;
  location: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  type: PropertyType;
  images: string[];
  amenities: string[];
  isAvailable: boolean;
  isFavorite?: boolean;
  landlord: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Listing Types (For Agent Platform) ====================
export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  type: 'rent' | 'sale';
  listingType: 'normal' | 'featured';
  images: string[];
  userId: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  createdAt: Date;
  expiresAt?: Date;
  boost?: Boost;
  views?: number;
  inquiries?: number;
  status?: 'active' | 'pending' | 'expired' | 'sold';
}

export interface Boost {
  type: 'top_search' | 'urgent_badge';
  price: number;
  expiresAt: Date;
  active: boolean;
  appliedAt?: Date;
}

export interface ListingStats {
  views: number;
  inquiries: number;
  favorites: number;
  shares?: number;
}

// ==================== Agent & Subscription Types ====================
export interface Subscription {
  id: string;
  userId: string;
  plan: 'basic' | 'pro' | 'premium';
  price: number;
  startDate: Date;
  endDate: Date;
  active: boolean;
  listingsLimit: number;
  listingsUsed: number;
  autoRenew?: boolean;
  features?: string[];
}

export interface Agent extends User {
  isVerified: boolean;
  subscription?: Subscription;
  freeListingsUsed: number;
  totalListings?: number;
  activeListings?: number;
  rating?: number;
  totalReviews?: number;
  businessName?: string;
  businessLicense?: string;
  taxId?: string;
  verifiedAt?: Date;
}

// ==================== Payment & Transaction Types ====================
export interface Transaction {
  id: string;
  userId: string;
  type: 'listing_fee' | 'subscription' | 'boost' | 'refund';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  description: string;
  reference?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  completedAt?: Date;
}

export interface PaymentMethod {
  id: string;
  userId: string;
  type: 'card' | 'mobile_money' | 'bank_transfer';
  last4?: string;
  provider?: string;
  isDefault: boolean;
  createdAt: Date;
}

// ==================== Review & Rating Types ====================
export interface Review {
  id: string;
  propertyId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt?: Date;
  landlordResponse?: {
    comment: string;
    createdAt: Date;
  };
}

// ==================== Message & Chat Types ====================
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  attachments?: string[];
  createdAt: Date;
}

export interface Conversation {
  id: string;
  participants: string[];
  propertyId?: string;
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Favorite & Saved Types ====================
export interface Favorite {
  id: string;
  userId: string;
  propertyId: string;
  createdAt: Date;
}

// ==================== Analytics Types ====================
export interface DashboardStats {
  totalProperties: number;
  activeListings: number;
  totalViews: number;
  totalInquiries: number;
  totalFavorites: number;
  monthlyRevenue: number;
  recentActivities: Activity[];
}

export interface Activity {
  id: string;
  type: 'view' | 'inquiry' | 'favorite' | 'listing_created' | 'listing_sold';
  propertyId?: string;
  propertyTitle?: string;
  userId?: string;
  userName?: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

// ==================== Form & Validation Types ====================
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  role: 'tenant' | 'landlord';
}

export interface CreatePropertyData {
  title: string;
  description: string;
  location: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  type: PropertyType;
  images: string[];
  amenities: string[];
  isAvailable: boolean;
}

export interface UpdateProfileData {
  name?: string;
  phone?: string;
  avatar?: string;
  businessName?: string;
}

// ==================== Error & Validation Types ====================
export interface ValidationError {
  field: string;
  message: string;
}

export interface AppError {
  code: string;
  message: string;
  details?: ValidationError[];
}

// ==================== Chart & UI Types ====================
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    fill?: boolean;
  }[];
}

export interface Option {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

// ==================== Theme & Config Types ====================
export interface Theme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  success: string;
  warning: string;
  error: string;
}

export interface AppConfig {
  appName: string;
  appVersion: string;
  apiUrl: string;
  environment: 'development' | 'staging' | 'production';
  features: {
    chat: boolean;
    reviews: boolean;
    analytics: boolean;
    boosts: boolean;
  };
}