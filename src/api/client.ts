import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse, TokenPair } from '../types/auth';
import { getErrorMessage } from '../utils/error';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    error.message = getErrorMessage(error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    // If backend returns 200 with success: false
    if (response.data && response.data.success === false) {
      const msg = getErrorMessage({ response });
      return Promise.reject(new Error(msg));
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/refresh') ||
        originalRequest.url?.includes('/auth/otp')
      ) {
        error.message = getErrorMessage(error);
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            err.message = getErrorMessage(err);
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        isRefreshing = false;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth:unauthorized'));
        error.message = getErrorMessage(error);
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post<ApiResponse<TokenPair>>(
          `${BASE_URL}/auth/refresh`,
          { refresh_token: refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        if (data.success && data.data) {
          const newTokens = data.data;
          localStorage.setItem('access_token', newTokens.access_token);
          localStorage.setItem('refresh_token', newTokens.refresh_token);

          apiClient.defaults.headers.common.Authorization = `Bearer ${newTokens.access_token}`;
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newTokens.access_token}`;
          }

          processQueue(null, newTokens.access_token);
          return apiClient(originalRequest);
        } else {
          throw new Error('Refresh failed');
        }
      } catch (refreshErr: any) {
        processQueue(refreshErr, null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth:unauthorized'));
        refreshErr.message = getErrorMessage(refreshErr);
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    error.message = getErrorMessage(error);
    return Promise.reject(error);
  }
);
