import { store } from '../store';
import { refreshToken } from '../store/slices/authSlice';
import { API_BASE_URL } from '../config/api';

interface ApiResponse<T> {
  data: T;
  status: number;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const state = store.getState();
  const accessToken = state.auth.accessToken;
  const refreshTokenValue = state.auth.refreshToken;

  const headers = {
    'Content-Type': 'application/json',
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    ...options.headers,
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401 && refreshTokenValue) {
      // Token expired, try to refresh
      try {
        await store.dispatch(refreshToken()).unwrap();
        // Retry the request with new token
        const newState = store.getState();
        const newHeaders = {
          ...headers,
          Authorization: `Bearer ${newState.auth.accessToken}`,
        };
        const retryResponse = await fetch(url, {
          ...options,
          headers: newHeaders,
        });
        return {
          data: await retryResponse.json(),
          status: retryResponse.status,
        };
      } catch (refreshError) {
        // If refresh fails, clear tokens and redirect to login
        store.dispatch({ type: 'auth/logout' });
        window.location.href = '/login';
        throw new Error('Session expired. Please log in again.');
      }
    }

    return {
      data: await response.json(),
      status: response.status,
    };
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
} 