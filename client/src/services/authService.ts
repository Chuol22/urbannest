import { api, ApiResponse } from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  user_type: string;
}

export interface AuthResponse {
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    user_type: string;
    created_at: string;
  };
  token: string;
  refreshToken?: string;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials);
      
      if (response.success && response.data?.token) {
        // Store tokens
        localStorage.setItem('auth_token', response.data.token);
        sessionStorage.setItem('auth_token', response.data.token);
        
        if (response.data.refreshToken) {
          localStorage.setItem('refresh_token', response.data.refreshToken);
          sessionStorage.setItem('refresh_token', response.data.refreshToken);
        }
        
        // Store user data
        localStorage.setItem('user_data', JSON.stringify(response.data.user));
        sessionStorage.setItem('user_data', JSON.stringify(response.data.user));
        
        // Set API token
        api.setAuthToken(response.data.token);
      }
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(userData: RegisterData): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await api.post<AuthResponse>('/auth/register', userData);
      
      if (response.success && response.data?.token) {
        // Store tokens
        localStorage.setItem('auth_token', response.data.token);
        sessionStorage.setItem('auth_token', response.data.token);
        
        if (response.data.refreshToken) {
          localStorage.setItem('refresh_token', response.data.refreshToken);
          sessionStorage.setItem('refresh_token', response.data.refreshToken);
        }
        
        // Store user data
        localStorage.setItem('user_data', JSON.stringify(response.data.user));
        sessionStorage.setItem('user_data', JSON.stringify(response.data.user));
        
        // Set API token
        api.setAuthToken(response.data.token);
      }
      
      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all tokens and user data regardless of API call success
      this.clearAuthData();
    }
  }

  async refreshToken(): Promise<ApiResponse<AuthResponse>> {
    try {
      const refreshToken = localStorage.getItem('refresh_token') || 
                         sessionStorage.getItem('refresh_token');
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post<AuthResponse>('/auth/refresh', { 
        refreshToken 
      });

      if (response.success && response.data?.token) {
        // Update tokens
        localStorage.setItem('auth_token', response.data.token);
        sessionStorage.setItem('auth_token', response.data.token);
        
        if (response.data.refreshToken) {
          localStorage.setItem('refresh_token', response.data.refreshToken);
          sessionStorage.setItem('refresh_token', response.data.refreshToken);
        }
        
        // Update user data
        localStorage.setItem('user_data', JSON.stringify(response.data.user));
        sessionStorage.setItem('user_data', JSON.stringify(response.data.user));
        
        // Set API token
        api.setAuthToken(response.data.token);
      }

      return response;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearAuthData();
      throw error;
    }
  }

  async forgotPassword(email: string): Promise<ApiResponse<any>> {
    try {
      return await api.post('/auth/forgot-password', { email });
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  }

  async resetPassword(token: string, password: string): Promise<ApiResponse<any>> {
    try {
      return await api.post('/auth/reset-password', { token, password });
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  async verifyEmail(token: string): Promise<ApiResponse<any>> {
    try {
      return await api.post('/auth/verify-email', { token });
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  }

  getCurrentUser(): any {
    try {
      const userData = localStorage.getItem('user_data') || 
                      sessionStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token') || 
                 sessionStorage.getItem('auth_token');
    return !!token;
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token') || 
           sessionStorage.getItem('auth_token');
  }

  private clearAuthData(): void {
    // Clear tokens
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('refresh_token');
    
    // Clear user data
    localStorage.removeItem('user_data');
    sessionStorage.removeItem('user_data');
    
    // Remove API token
    api.removeAuthToken();
  }

  // Initialize auth state from storage
  initializeAuth(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    
    if (token && user) {
      api.setAuthToken(token);
      return true;
    }
    
    return false;
  }
}

export const authService = new AuthService();
export default authService;