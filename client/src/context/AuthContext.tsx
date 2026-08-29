import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

// Updated User interface to match backend response
interface User {
  id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  role: 'seeker' | 'owner' | 'agent' | 'admin';
  is_verified: boolean;
  is_active: boolean;
  avatar_url?: string | null;
  created_at: string;
  updated_at?: string;
  last_login?: string | null;
  verification_status?: 'pending_review' | 'approved' | 'rejected';
  verification_document_url?: string | null;
  verification_rejection_reason?: string | null;
  [key: string]: any;
}

// Registration data interface - MATCHES BACKEND EXPECTATIONS
interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone: string;
  role?: string;
}

// Login data interface
interface LoginData {
  email: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoggedIn: boolean;
  login: (credentials: LoginData) => Promise<User>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Secure token storage
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

// Storage helpers
const setSecureToken = (token: string, refreshToken?: string) => {
  sessionStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_KEY, token); // Backup for persistence
  if (refreshToken) {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
};

const getSecureToken = () => {
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
};

const getRefreshToken = () => {
  return sessionStorage.getItem(REFRESH_TOKEN_KEY) || localStorage.getItem(REFRESH_TOKEN_KEY);
};

const removeSecureToken = () => {
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

const setUserData = (user: User) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

const getUserData = (): User | null => {
  const userStr = localStorage.getItem(USER_KEY);
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Validate token and fetch user data
  const validateToken = useCallback(async () => {
    const token = getSecureToken();
    if (!token) {
      // Try to restore from localStorage
      const savedUser = getUserData();
      if (savedUser) {
        setUser(savedUser);
        setIsLoggedIn(true);
      }
      setLoading(false);
      return;
    }

    try {
      // Set default authorization header
      api.setAuthToken(token);
      
      const response = await api.get('/auth/session');
      if (response.success && response.data) {
        setUser(response.data);
        setIsLoggedIn(true);
        setUserData(response.data);
      } else {
        removeSecureToken();
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      removeSecureToken();
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    validateToken();
  }, [validateToken]);

  const login = async (credentials: LoginData) => {
    // Validate input before sending
    if (!credentials.email || !credentials.password) {
      throw new Error('Email and password are required');
    }

    try {
      const response = await api.post('/auth/login', credentials);
      
      if (response.success && response.data) {
        // api.ts interceptor wraps server response: response.data.data holds the actual payload
        const payload = response.data?.data ?? response.data;
        const { token, refreshToken, user: userData } = payload;
        
        // Store tokens securely (persisted in both sessionStorage + localStorage)
        setSecureToken(token, refreshToken);
        api.setAuthToken(token);
        
        setUser(userData);
        setIsLoggedIn(true);
        setUserData(userData);
        return userData; // Return user data for redirect logic
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Invalid email or password');
    }
  };

  const register = async (userData: RegisterData) => {
    // Validate required fields - MATCH BACKEND REQUIREMENTS
    if (!userData.first_name) {
      throw new Error('First name is required');
    }
    if (!userData.last_name) {
      throw new Error('Last name is required');
    }
    if (!userData.email) {
      throw new Error('Email is required');
    }
    if (!userData.password) {
      throw new Error('Password is required');
    }
    if (!userData.phone) {
      throw new Error('Phone number is required');
    }
    if (userData.password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    try {
      // Send data exactly as backend expects
      const response = await api.post('/auth/register', {
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        password: userData.password,
        phone: userData.phone,
        role: userData.role || 'seeker'
      });
      
      if (response.success && response.data) {
        // api.ts interceptor wraps server response: response.data.data holds the actual payload
        const payload = response.data?.data ?? response.data;
        const { token, refreshToken, user: newUser } = payload;
        
        setSecureToken(token, refreshToken);
        api.setAuthToken(token);
        
        setUser(newUser);
        setIsLoggedIn(true);
        setUserData(newUser);
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Registration failed. Please try again.');
    }
  };

  const logout = async () => {
    try {
      const token = getSecureToken();
      if (token) {
        api.setAuthToken(token);
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      removeSecureToken();
      api.removeAuthToken();
      setUser(null);
      setIsLoggedIn(false);
    }
  };

  const refreshToken = async () => {
    const refreshTokenStr = getRefreshToken();
    if (!refreshTokenStr) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await api.post('/auth/refresh', { refreshToken: refreshTokenStr });
      if (response.success && response.data) {
        // Handle double-wrapped response
        const payload = response.data?.data ?? response.data;
        const { token, refreshToken: newRefresh } = payload;
        setSecureToken(token, newRefresh);
        api.setAuthToken(token);
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      await logout();
      throw error;
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      const response = await api.patch('/auth/profile', userData);
      if (response.success && response.data) {
        setUser(prev => prev ? { ...prev, ...response.data } : null);
        if (response.data) {
          setUserData({ ...user!, ...response.data });
        }
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isLoggedIn,
        login,
        register,
        logout,
        refreshToken,
        refreshUser: validateToken,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};