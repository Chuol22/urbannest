import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { api } from '../services/api';

// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'tenant' | 'landlord' | 'admin';
  emailVerified: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

// Login credentials interface
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Register data interface
export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: 'tenant' | 'landlord';
  acceptTerms?: boolean;
}

// Auth context type
export interface AuthContextType {
  // State
  user: User | null;
  isLoggedIn: boolean;
  loading: boolean;
  error: string | null;
  
  // Authentication Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  
  // User Management
  updateUser: (data: Partial<User>) => Promise<void>;
  updateAvatar?: (file: File) => Promise<void>;
  
  // Email Verification
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  
  // Password Management
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  
  // Session Management
  refreshToken: () => Promise<void>;
  clearError: () => void;
  
  // Helpers
  hasRole: (role: User['role'] | User['role'][]) => boolean;
  isVerified: boolean;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
  onTokenRefresh?: () => void;
  onSessionExpired?: () => void;
}

// Auth Provider Component
export const AuthProvider: React.FC<AuthProviderProps> = ({ 
  children, 
  onTokenRefresh,
  onSessionExpired 
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
 const [tokenRefreshTimeout, setTokenRefreshTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
 
 // Clear error helper
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Check if user has required role
  const hasRole = useCallback((role: User['role'] | User['role'][]) => {
    if (!user) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  }, [user]);

  // Load user from storage
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('auth_user');
        const tokenExpiry = localStorage.getItem('auth_token_expiry');
        
        // Check token expiry
        if (tokenExpiry && new Date().getTime() > parseInt(tokenExpiry)) {
          console.warn('Token expired');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          localStorage.removeItem('auth_token_expiry');
          if (onSessionExpired) onSessionExpired();
          return;
        }
        
        if (token && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          
          // Verify token with backend
          try {
            await verifyToken(token);
          } catch (error) {
            console.error('Token verification failed:', error);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            localStorage.removeItem('auth_token_expiry');
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Failed to load user:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_token_expiry');
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    loadUser();
  }, [onSessionExpired]);

  // Setup token refresh interval
  useEffect(() => {
    if (user && tokenRefreshTimeout) {
      clearTimeout(tokenRefreshTimeout);
    }
    
    if (user) {
      const timeout = setTimeout(() => {
        refreshToken();
      }, 50 * 60 * 1000);
      
      setTokenRefreshTimeout(timeout);
    }
    
    return () => {
      if (tokenRefreshTimeout) {
        clearTimeout(tokenRefreshTimeout);
      }
    };
  }, [user]);

  const verifyToken = async (_token: string) => {
    try {
      const response = await api.get<{ user: User }>('/auth/verify');
      if (response.success) {
        setUser(response.data.user);
        localStorage.setItem('auth_user', JSON.stringify(response.data.user));
        return true;
      } else {
        throw new Error('Invalid token');
      }
    } catch (error) {
      console.error('Token verification error:', error);
      throw error;
    }
  };

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('auth_refresh_token');
      if (!refreshToken) throw new Error('No refresh token');
      
      const response = await api.post<{ token: string; refreshToken: string }>('/auth/refresh', {
        refreshToken,
      });
      
      if (response.success) {
        const { token, refreshToken: newRefreshToken } = response.data;
        const expiry = new Date().getTime() + 60 * 60 * 1000;
        
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_refresh_token', newRefreshToken);
        localStorage.setItem('auth_token_expiry', expiry.toString());
        
        if (onTokenRefresh) onTokenRefresh();
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
      if (onSessionExpired) onSessionExpired();
    }
  };

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post<{ user: User; token: string; refreshToken: string }>('/auth/login', credentials);
      
      if (response.success) {
        const { user, token, refreshToken } = response.data;
        const expiry = new Date().getTime() + 60 * 60 * 1000;
        
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_refresh_token', refreshToken);
        localStorage.setItem('auth_user', JSON.stringify(user));
        localStorage.setItem('auth_token_expiry', expiry.toString());
        
        if (credentials.rememberMe) {
          localStorage.setItem('remember_me', 'true');
        } else {
          localStorage.removeItem('remember_me');
        }
        
        setUser(user);
      } else {
        const errorMessage = response.message || 'Login failed';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!data.acceptTerms) {
        throw new Error('You must accept the terms and conditions');
      }
      
      const response = await api.post<{ user: User; token: string; refreshToken: string }>('/auth/register', {
        ...data,
        role: data.role || 'tenant',
      });
      
      if (response.success) {
        const { user, token, refreshToken } = response.data;
        const expiry = new Date().getTime() + 60 * 60 * 1000;
        
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_refresh_token', refreshToken);
        localStorage.setItem('auth_user', JSON.stringify(user));
        localStorage.setItem('auth_token_expiry', expiry.toString());
        
        setUser(user);
      } else {
        const errorMessage = response.message || 'Registration failed';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_refresh_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token_expiry');
    
    if (!localStorage.getItem('remember_me')) {
      localStorage.removeItem('remember_me');
    }
    
    setUser(null);
    setError(null);
    
    if (tokenRefreshTimeout) {
      clearTimeout(tokenRefreshTimeout);
      setTokenRefreshTimeout(null);
    }
    
    api.post('/auth/logout').catch(console.error);
  }, [tokenRefreshTimeout]);

  const updateUser = async (data: Partial<User>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.put<{ user: User }>('/auth/profile', data);
      
      if (response.success) {
        const updatedUser = { ...user, ...response.data.user };
        setUser(updatedUser);
        localStorage.setItem('auth_user', JSON.stringify(updatedUser));
      } else {
        const errorMessage = response.message || 'Update failed';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Update user error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Update failed';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      
      if (!response.success) {
        const errorMessage = response.message || 'Failed to change password';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Change password error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to change password';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/auth/forgot-password', { email });
      
      if (!response.success) {
        const errorMessage = response.message || 'Failed to send reset email';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Forgot password error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send reset email';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (token: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/auth/reset-password', { token, password });
      
      if (!response.success) {
        const errorMessage = response.message || 'Failed to reset password';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Reset password error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to reset password';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (token: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/auth/verify-email', { token });
      
      if (response.success && user) {
        const updatedUser = { ...user, emailVerified: true };
        setUser(updatedUser);
        localStorage.setItem('auth_user', JSON.stringify(updatedUser));
      } else {
        const errorMessage = response.message || 'Verification failed';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Email verification error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Verification failed';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    if (!user) throw new Error('No user logged in');
    setError(null);
    
    try {
      const response = await api.post('/auth/resend-verification', { email: user.email });
      
      if (!response.success) {
        const errorMessage = response.message || 'Failed to resend verification';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Resend verification error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to resend verification';
      setError(errorMessage);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoggedIn: !!user,
    loading: loading || !initialized,
    error,
    login,
    register,
    logout,
    updateUser,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    changePassword,
    refreshToken,
    clearError,
    hasRole,
    isVerified: user?.emailVerified || false,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export everything as default
export default AuthContext;