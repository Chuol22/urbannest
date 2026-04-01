// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { Validator } from '../utils/validators';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  emailVerified: boolean;
  role: 'user' | 'agent' | 'admin';
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoggedIn: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (userData: { name: string; email: string; password: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Secure token storage (using httpOnly cookies is better, but this is a safer alternative)
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// Use sessionStorage instead of localStorage for better security
const setSecureToken = (token: string) => {
  sessionStorage.setItem(TOKEN_KEY, token);
};

const getSecureToken = () => {
  return sessionStorage.getItem(TOKEN_KEY);
};

const removeSecureToken = () => {
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY); // Clear any old tokens
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Validate token and fetch user data
  const validateToken = useCallback(async () => {
    const token = getSecureToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      if (response.success && response.data) {
        setUser(response.data);
        setIsLoggedIn(true);
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

  const login = async (credentials: { email: string; password: string }) => {
    // Validate input before sending
    const validation = Validator.validateLogin(credentials);
    if (!validation.isValid) {
      throw new Error(Object.values(validation.errors)[0]);
    }

    try {
      const response = await api.post('/auth/login', credentials);
      
      if (response.success && response.data) {
        const { token, refreshToken, user: userData } = response.data;
        
        // Store tokens securely
        setSecureToken(token);
        if (refreshToken) {
          sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        }
        
        setUser(userData);
        setIsLoggedIn(true);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || 'Invalid email or password');
    }
  };

  const register = async (userData: { name: string; email: string; password: string; phone?: string }) => {
    // Validate input before sending
    const validation = Validator.validateUserRegistration(userData);
    if (!validation.isValid) {
      throw new Error(Object.values(validation.errors)[0]);
    }

    try {
      const response = await api.post('/auth/register', userData);
      
      if (response.success && response.data) {
        const { token, refreshToken, user: newUser } = response.data;
        
        setSecureToken(token);
        if (refreshToken) {
          sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        }
        
        setUser(newUser);
        setIsLoggedIn(true);
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  const logout = async () => {
    try {
      const token = getSecureToken();
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      removeSecureToken();
      sessionStorage.removeItem(REFRESH_TOKEN_KEY);
      setUser(null);
      setIsLoggedIn(false);
    }
  };

  const refreshToken = async () => {
    const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await api.post('/auth/refresh', { refreshToken });
      if (response.success && response.data) {
        setSecureToken(response.data.token);
        if (response.data.refreshToken) {
          sessionStorage.setItem(REFRESH_TOKEN_KEY, response.data.refreshToken);
        }
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