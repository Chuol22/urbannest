import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader } from '../ui/Loader';
import { Alert } from '../ui/Alert';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireGuest?: boolean;
  requireVerification?: boolean;
  fallback?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAuth = false,
  requireGuest = false,
  requireVerification = false,
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
    return <Navigate to="/dashboard" replace />;
  }

  // Handle authenticated-only pages
  if (requireAuth && !isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
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
          message="Please verify your email address to access this page. Check your inbox for a verification link."
        />
      </div>
    );
  }

  return <>{children}</>;
};