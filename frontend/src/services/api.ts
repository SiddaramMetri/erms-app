import axios from 'axios';
import { shouldRefreshToken } from '@/utils/jwt';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3300/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor to add auth token and handle proactive refresh
api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      // Check if token should be refreshed proactively
      if (shouldRefreshToken(token) && !isRefreshing && !config.url?.includes('/auth/refresh-token')) {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (refreshToken) {
          isRefreshing = true;
          
          try {
            const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
              refreshToken: refreshToken
            });

            if (response.data.success) {
              const { accessToken, refreshToken: newRefreshToken } = response.data.data;
              
              localStorage.setItem('token', accessToken);
              if (newRefreshToken) {
                localStorage.setItem('refreshToken', newRefreshToken);
              }
              
              config.headers.Authorization = `Bearer ${accessToken}`;
            }
          } catch (error) {
            console.error('Proactive token refresh failed:', error);
            // Continue with current token, let the response interceptor handle expiration
          } finally {
            isRefreshing = false;
          }
        }
      }
      
      // Use current token (might be refreshed above)
      const currentToken = localStorage.getItem('token');
      if (currentToken) {
        config.headers.Authorization = `Bearer ${currentToken}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    console.error('API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method
    });
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            refreshToken: refreshToken
          });

          if (response.data.success) {
            const { accessToken, refreshToken: newRefreshToken } = response.data.data;
            
            localStorage.setItem('token', accessToken);
            if (newRefreshToken) {
              localStorage.setItem('refreshToken', newRefreshToken);
            }

            processQueue(null, accessToken);
            
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          processQueue(refreshError, null);
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // No refresh token, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }

    // Enhanced error handling with user-friendly messages
    if (error.response?.data?.error) {
      error.message = error.response.data.error;
    } else if (error.response?.status === 403) {
      error.message = 'Access denied. You do not have permission to perform this action.';
    } else if (error.response?.status === 404) {
      error.message = 'Resource not found.';
    } else if (error.response?.status === 409) {
      error.message = 'Conflict: This resource already exists or has conflicting data.';
    } else if (error.response?.status === 429) {
      error.message = 'Too many requests. Please wait a moment before trying again.';
    } else if (error.response?.status >= 500) {
      error.message = 'Server error. Please try again later.';
    } else if (error.code === 'NETWORK_ERROR') {
      error.message = 'Network error. Please check your internet connection.';
    }

    return Promise.reject(error);
  }
);

export default api;