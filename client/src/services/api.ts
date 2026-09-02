import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

import DOMPurify from 'dompurify';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

class ApiService {
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: any) => void;
  }> = [];

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add CSRF token if available (for extra security)
        const csrfToken = this.getCsrfToken();
        if (csrfToken && config.headers) {
          config.headers['X-CSRF-Token'] = csrfToken;
        }

        // Sanitize request data if it's a POST/PUT/PATCH
        if (config.data && typeof config.data === 'object') {
          config.data = this.sanitizeData(config.data);
        }

        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // If the backend already returns { success, data, message } format
        const resData = response.data;
        if (resData && typeof resData === 'object' && 'success' in resData) {
          return {
            ...response,
            data: {
              success: Boolean(resData.success),
              data: resData.data !== undefined ? resData.data : resData,
              message: resData.message,
              error: resData.error
            }
          };
        }
        return {
          ...response,
          data: {
            success: true,
            data: resData,
            message: resData?.message,
          }
        };
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        const url = originalRequest?.url || '';
        const isAuthEndpoint = 
          url.includes('/auth/login') || 
          url.includes('/auth/register') || 
          url.includes('/auth/refresh') ||
          url.includes('/auth/forgot-password') ||
          url.includes('/auth/reset-password') ||
          url.includes('/auth/verify-email');

        // Handle 401 Unauthorized errors (token expired) only for protected non-auth requests
        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
          const refreshToken = sessionStorage.getItem('refresh_token') || localStorage.getItem('refresh_token');
          if (!refreshToken) {
            this.clearTokens();
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
            return {
              data: {
                success: false,
                message: 'Session expired. Please log in again.',
              }
            };
          }

          if (this.isRefreshing) {
            // Queue the request while token is being refreshed
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then(() => this.axiosInstance(originalRequest))
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            await this.refreshToken();
            this.processQueue(null);
            return this.axiosInstance(originalRequest);
          } catch (refreshError: any) {
            this.processQueue(refreshError);
            this.clearTokens();
            // Silently redirect to login without propagating the refresh error
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
            return {
              data: {
                success: false,
                message: 'Session expired. Please log in again.',
              }
            };
          } finally {
            this.isRefreshing = false;
          }
        }

        // Log errors in development
        if (import.meta.env.DEV) {
          console.error('API Error:', {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
          });
        }

        // Return formatted error response - always ensure message is a string
        const rawMsg = (error.response?.data as any)?.message;
        let safeMessage: string;
        if (!rawMsg) {
          safeMessage = error.message || 'Request failed';
        } else if (typeof rawMsg === 'string') {
          safeMessage = rawMsg;
        } else if (typeof rawMsg === 'object') {
          // Chapa-style field validation errors: { field: ["msg1"], "field2": ["msg2"] }
          safeMessage = Object.entries(rawMsg as Record<string, unknown>)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
            .join(' | ');
        } else {
          safeMessage = String(rawMsg);
        }

        return {
          data: {
            success: false,
            message: safeMessage,
            error: error.code,
          }
        };
      }
    );
  }

  private getToken(): string | null {
    return sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
  }

  private getCsrfToken(): string | null {
    const csrfToken = document.querySelector('meta[name="csrf-token"]');
    return csrfToken ? csrfToken.getAttribute('content') : null;
  }

  private async refreshToken() {
    const refreshToken = sessionStorage.getItem('refresh_token') || localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.axiosInstance.post('/auth/refresh', { refreshToken });
    const data = response.data as any;

    if (data?.token) {
      this.setToken(data.token);
      if (data.refreshToken) {
        sessionStorage.setItem('refresh_token', data.refreshToken);
        localStorage.setItem('refresh_token', data.refreshToken);
      }
    } else if (data?.data?.token) {
      this.setToken(data.data.token);
      if (data.data.refreshToken) {
        sessionStorage.setItem('refresh_token', data.data.refreshToken);
        localStorage.setItem('refresh_token', data.data.refreshToken);
      }
    } else {
      throw new Error('Token refresh failed');
    }
  }

  private processQueue(error: any = null) {
    this.failedQueue.forEach(promise => {
      if (error) {
        promise.reject(error);
      } else {
        promise.resolve();
      }
    });
    this.failedQueue = [];
  }

  private clearTokens() {
    sessionStorage.removeItem('auth_token');
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('refresh_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
  }

  private setToken(token: string) {
    sessionStorage.setItem('auth_token', token);
    localStorage.setItem('auth_token', token);
  }

  private sanitizeData(data: any): any {
    if (typeof data === 'string') {
      return DOMPurify.sanitize(data);
    }
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const key in data) {
        if (typeof data[key] === 'string') {
          sanitized[key] = DOMPurify.sanitize(data[key]);
        } else if (typeof data[key] === 'object') {
          sanitized[key] = this.sanitizeData(data[key]);
        } else {
          sanitized[key] = data[key];
        }
      }
      return sanitized;
    }
    return data;
  }

  // Public methods
  setAuthToken(token: string) {
    this.setToken(token);
  }

  removeAuthToken() {
    this.clearTokens();
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.get(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.post(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.put(url, data, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.patch(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.delete(url, config);
    return response.data;
  }
}

export const api = new ApiService();