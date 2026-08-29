// client/src/types/admin.types.ts

export type Role = 'seeker' | 'owner' | 'agent' | 'admin';

export type VerificationStatus = 'unverified' | 'pending_review' | 'approved' | 'rejected';

export interface AdminUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: Role;
  is_active: boolean;
  is_verified: boolean;
  two_factor_enabled: boolean;
  created_at: string;
  updated_at?: string;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  admin_name: string;
  admin_email: string;
  action_type: string;
  target_resource: string;
  target_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
}

export interface DashboardMetrics {
  totalUsers: number;
  usersByRole: Record<Role, number>;
  pendingVerifications: Record<string, number>;
  propertiesByStatus: {
    available: number;
    pending: number;
    rented: number;
    sold: number;
    withdrawn: number;
  };
  totalRevenue: number;
  pendingBookings: number;
  activeAdmins: number;
}

export interface PlatformUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: Role;
  is_active: boolean;
  is_verified: boolean;
  verification_status: VerificationStatus;
  verification_document_url?: string | null;
  verification_rejection_reason?: string | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at?: string;
  _count?: {
    properties: number;
    bookings: number;
  };
}

export interface PlatformListing {
  id: string;
  title: string;
  purpose: string;
  property_type: string;
  price: number;
  status: 'pending' | 'available' | 'rented' | 'sold' | 'withdrawn';
  listing_fee_paid: boolean;
  listing_rejection_reason?: string | null;
  created_at: string;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  location?: {
    city?: string;
    subcity?: string;
  };
  photos?: Array<{ id: string; url: string; isPrimary: boolean }>;
}

export interface PlatformPayment {
  id: string;
  txRef?: string | null;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  paymentMethod?: string | null;
  createdAt: string;
  user?: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  property?: {
    title: string;
    purpose?: string;
    status?: string;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    logs?: T[];
    admins?: T[];
    users?: T[];
    listings?: T[];
    payments?: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  admin_id?: string;
  action_type?: string;
  resource?: string;
  from_date?: string;
  to_date?: string;
  search?: string;
}
