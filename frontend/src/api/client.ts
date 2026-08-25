import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS, STORAGE_KEYS, CUSTOM_EVENTS } from '../constants';

export { API_BASE_URL };

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 15000,
});

// Response interceptor: handle automatic token refresh via HttpOnly cookies on 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 1. Network / Offline / Connection Timeout Interceptor
    if (!error.response || error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      const networkMessage = isOffline
        ? 'You appear to be offline. Please check your internet connection.'
        : 'Unable to connect to the EventHub server. Please verify your connection or try again shortly.';

      error.response = {
        status: 0,
        statusText: 'Network Error',
        headers: {},
        config: originalRequest || {},
        data: {
          success: false,
          error: {
            message: networkMessage,
            code: 'NETWORK_ERROR',
          },
        },
      };

      return Promise.reject(error);
    }

    // 2. Rate Limit (429) Handling
    if (error.response.status === 429 && !error.response.data?.error?.message) {
      error.response.data = {
        success: false,
        error: {
          message: 'Too many requests. Please slow down and wait a moment before trying again.',
          code: 'RATE_LIMIT_EXCEEDED',
        },
      };
    }

    // 3. Automatic 401 Token Refresh Handling
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes(API_ENDPOINTS.AUTH.LOGIN) &&
      !originalRequest.url?.includes(API_ENDPOINTS.AUTH.REGISTER) &&
      !originalRequest.url?.includes(API_ENDPOINTS.AUTH.REFRESH_TOKEN)
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Refresh token is sent automatically via HttpOnly cookie
        await axios.post(
          `${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH_TOKEN}`,
          {},
          { withCredentials: true }
        );

        processQueue(null);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
        window.dispatchEvent(new Event(CUSTOM_EVENTS.AUTH_LOGOUT));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
