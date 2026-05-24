import axios from 'axios';
import { showError } from '../utils/toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper to get the base server URL (without /api)
export const getServerUrl = (path = '') => {
  // Remove trailing slashes and normalize
  const normalizedApiUrl = API_URL.replace(/\/+$/, '');
  const base = normalizedApiUrl.endsWith('/api') ? normalizedApiUrl.slice(0, -4) : normalizedApiUrl;
  if (!path) return base;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
};

// Helper to get the API URL
export const getApiUrl = (path = '') => {
  if (!path) return API_URL;
  const normalizedApiUrl = API_URL.replace(/\/+$/, '');
  return `${normalizedApiUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];
let isAuthenticated = false; // New state variable

// Exported function to update authentication state
export const setAuthenticatedState = (state) => {
  isAuthenticated = state;
};

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Request interceptor
apiClient.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptor for handling token expiration
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't intercept auth endpoints (except /me)
    const isAuthEndpoint = originalRequest.url?.includes('/auth/') &&
      !originalRequest.url?.includes('/auth/me');

    // If the request is marked as skipAuthRedirect, silently reject without redirecting
    // Used for background polling requests (e.g. unread count) that should not kick the user out
    if (error.response?.status === 401 && originalRequest.skipAuthRedirect) {
      // Still attempt refresh silently, just don't redirect on failure
      if (!isRefreshing && !originalRequest._retry) {
        originalRequest._retry = true;
        isRefreshing = true;
        try {
          await axios.post(
            `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
            {},
            { withCredentials: true }
          );
          processQueue(null);
          isRefreshing = false;
          return apiClient(originalRequest);
        } catch {
          processQueue(new Error('refresh failed'));
          isRefreshing = false;
        }
      }
      return Promise.reject(error);
    }

    // If 401 and not an auth endpoint and haven't retried yet
    if (error.response?.status === 401 && !isAuthEndpoint && !originalRequest._retry) {

      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh the token
        await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        processQueue(null);
        isRefreshing = false;

        // Retry the original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        isRefreshing = false;

        // Only redirect if the user was previously authenticated AND
        // we're not already on login/register pages
        // In Electron, HashRouter is used so routes are in the hash (e.g. #/login)
        // window.location.pathname is always '/' in Electron, so we check the hash instead
        const isElectron = window.navigator.userAgent.includes('Electron');
        const authPages = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];
        const currentRoute = isElectron
          ? window.location.hash.replace('#', '') // e.g. '#/login' -> '/login'
          : window.location.pathname;

        if (isAuthenticated && !authPages.includes(currentRoute)) {
          showError('Session expired. Please login again.');

          // Redirect to login after a short delay
          // In Electron, use hash navigation to stay within the file:// protocol
          setTimeout(() => {
            if (isElectron) {
              window.location.hash = '#/login';
            } else {
              window.location.href = '/login';
            }
          }, 1000);
        }

        return Promise.reject(refreshError);
      }
    }

    // For other errors, show appropriate message (but not for auth endpoints)
    if (!isAuthEndpoint) {
      if (error.response?.status === 403) {
        showError(error.response.data?.error?.message || 'Access denied');
      } else if (error.response?.status === 404) {
        showError(error.response.data?.error?.message || 'Resource not found');
      } else if (error.response?.status >= 500) {
        showError('Server error. Please try again later.');
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;