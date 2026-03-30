import { useAuth as useAuthContext } from '../context/AuthContext';
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface UseAuthReturn {
  // Auth state
  user: any;
  isLoggedIn: boolean;
  loading: boolean;
  
  // Auth actions
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: any) => Promise<void>;
  updateAvatar?: (file: File) => Promise<void>;
  
  // Password management
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>; // Add this
  
  // Email verification
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  
  // Helper states
  isAuthenticating: boolean;
  authError: string | null;
  clearError: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const auth = useAuthContext();
  const navigate = useNavigate();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setAuthError(null);
  }, []);

  const login = useCallback(async (email: string, password: string, rememberMe?: boolean) => {
    setIsAuthenticating(true);
    setAuthError(null);
    
    try {
      await auth.login({ email, password, rememberMe });
      navigate('/dashboard');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';
      setAuthError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  }, [auth, navigate]);

  const register = useCallback(async (name: string, email: string, password: string, phone?: string) => {
    setIsAuthenticating(true);
    setAuthError(null);
    
    try {
      await auth.register({ name, email, password, phone });
      navigate('/dashboard');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      setAuthError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  }, [auth, navigate]);

  const logout = useCallback(() => {
    auth.logout();
    navigate('/');
  }, [auth, navigate]);

  const updateProfile = useCallback(async (data: any) => {
    setIsAuthenticating(true);
    setAuthError(null);
    
    try {
      await auth.updateUser(data);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update profile.';
      setAuthError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  }, [auth]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    setIsAuthenticating(true);
    setAuthError(null);
    
    try {
      await auth.changePassword(currentPassword, newPassword);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to change password.';
      setAuthError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  }, [auth]);

  const forgotPassword = useCallback(async (email: string) => {
    setIsAuthenticating(true);
    setAuthError(null);
    
    try {
      await auth.forgotPassword(email);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to send reset email.';
      setAuthError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  }, [auth]);

  const resetPassword = useCallback(async (token: string, password: string) => {
    setIsAuthenticating(true);
    setAuthError(null);
    
    try {
      await auth.resetPassword(token, password);
      navigate('/login');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to reset password.';
      setAuthError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  }, [auth, navigate]);

  const verifyEmail = useCallback(async (token: string) => {
    setIsAuthenticating(true);
    setAuthError(null);
    
    try {
      await auth.verifyEmail(token);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Email verification failed.';
      setAuthError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  }, [auth]);

  const resendVerification = useCallback(async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    
    try {
      await auth.resendVerification();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to resend verification email.';
      setAuthError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  }, [auth]);

  return {
    // Auth state
    user: auth.user,
    isLoggedIn: auth.isLoggedIn,
    loading: auth.loading,
    
    // Auth actions
    login,
    register,
    logout,
    updateProfile,
    
    // Password management
    forgotPassword,
    resetPassword,
    changePassword, // Add this to the return object
    
    // Email verification
    verifyEmail,
    resendVerification,
    
    // Helper states
    isAuthenticating,
    authError,
    clearError,
  };
};