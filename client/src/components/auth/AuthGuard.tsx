// src/components/auth/AuthGuard.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader } from '../ui/Loader';
import { Alert } from '../ui/Alert';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireGuest?: boolean;
  requireVerification?: boolean;
  requireRole?: 'user' | 'agent' | 'admin';
  fallback?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAuth = false,
  requireGuest = false,
  requireVerification = false,
  requireRole,
  fallback,
}) => {
  const { isLoggedIn, loading, user } = useAuth();
  const location = useLocation();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  // Handle guest-only pages (e.g., login, register)
  if (requireGuest && isLoggedIn) {
    const from = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  // Handle authenticated-only pages
  if (requireAuth && !isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Handle role-based access
  if (requireRole && user && user.role !== requireRole) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert 
          type="warning" 
          title="Access Denied"
          message="You don't have permission to access this page. Please contact support if you believe this is an error."
        />
      </div>
    );
  }

  // Handle email verification requirement
  if (requireVerification && isLoggedIn && !user?.emailVerified) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert 
          type="warning" 
          title="Email Verification Required"
          message="Please verify your email address to access this page. Check your inbox for a verification link. If you didn't receive the email, check your spam folder or request a new verification link."
          onClose={() => {}}
        />
      </div>
    );
  }

  return <>{children}</>;
};