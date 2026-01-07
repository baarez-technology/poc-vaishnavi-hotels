import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { ENV } from '@/config/env';

// Create axios instance
export const apiClient = axios.create({
  baseURL: ENV.API_URL,
  timeout: ENV.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Using Bearer tokens, not cookies
});

// Token storage - persist in localStorage for refresh persistence
const TOKEN_KEY = 'glimmora_access_token';
let accessToken: string | null = null;

// Initialize token from localStorage on module load
const initializeToken = () => {
  try {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (storedToken) {
      accessToken = storedToken;
    }
  } catch (error) {
    console.error('Error loading token from localStorage:', error);
  }
};

// Initialize on module load
initializeToken();

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (error) {
    console.error('Error saving token to localStorage:', error);
  }
};

export const getAccessToken = () => {
  // If token is null in memory, try to load from localStorage
  if (!accessToken) {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (storedToken) {
        accessToken = storedToken;
      }
    } catch (error) {
      console.error('Error loading token from localStorage:', error);
    }
  }
  return accessToken;
};

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Don't add Authorization header for public endpoints
    const isPublicEndpoint = config.url?.includes('/api/v1/auth/login') ||
                          config.url?.includes('/api/v1/auth/signup') ||
                          config.url?.includes('/api/v1/auth/token') ||
                          config.url?.includes('/api/v1/auth/forgot-password') ||
                          config.url?.includes('/api/v1/auth/reset-password') ||
                          config.url?.includes('/api/v1/otp/') ||
                          config.url?.includes('/api/v1/precheckin/verify-booking');
    
    // Add access token if available and not a public endpoint
    if (accessToken && !isPublicEndpoint) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    // Ensure Content-Type is set for POST/PUT requests
    if ((config.method === 'post' || config.method === 'put' || config.method === 'patch') && 
        config.data && 
        !config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Backend returns data directly, not wrapped in { data: ... }
    // For auth endpoints, return data as-is (they return { access_token: "..." } directly)
    if (response.config.url?.includes('/api/v1/auth/login') || 
        response.config.url?.includes('/api/v1/auth/token')) {
      // Auth endpoints return { access_token: "...", token_type: "bearer" } directly
      return response;
    }
    
    // For guest-assistant endpoints, return data as-is (they return structured responses directly)
    if (response.config.url?.includes('/api/v1/guest-assistant/')) {
      return response;
    }

    // For AGI assistant endpoints, return data as-is
    if (response.config.url?.includes('/api/v1/agi/')) {
      return response;
    }

    // For Admin AI endpoints, return data as-is
    if (response.config.url?.includes('/api/v1/admin-ai/')) {
      return response;
    }

    // For other endpoints, check if data is wrapped
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return { ...response, data: response.data };
    }
    // Wrap in ApiResponse format if not already
    if (response.data && !response.data.success && !response.data.access_token) {
      return { ...response, data: { success: true, data: response.data } };
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 - Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const response = await axios.post(
          `${ENV.API_URL}/api/v1/auth/refresh`,
          {},
          { withCredentials: false }
        );

        const newAccessToken = response.data.access_token || response.data.accessToken;
        setAccessToken(newAccessToken);

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        setAccessToken(null);
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle network errors
    if (!error.response) {
      return Promise.reject(
        new Error('Network error. Please check your connection.')
      );
    }

    return Promise.reject(error);
  }
);
