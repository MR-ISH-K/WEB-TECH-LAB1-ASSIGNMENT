import axios from 'axios';

export const TOKEN_KEY = 'cmn_token';
export const USER_KEY = 'cmn_user';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
});

api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (e) {
    console.warn('Storage unavailable', e);
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    // An expired/invalid token on a request that sent one: drop the session.
    if (error.response?.status === 401 && localStorage.getItem(TOKEN_KEY) && !error.config?.url?.startsWith('/auth/')) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.dispatchEvent(new Event('cmn:logout'));
    }
    return Promise.reject(error);
  }
);

/** Human readable message from an axios error. */
export function errMsg(error) {
  const data = error?.response?.data;
  if (data?.fieldErrors) {
    return Object.entries(data.fieldErrors).map(([f, m]) => `${f}: ${m}`).join('; ');
  }
  if (data?.message) return data.message;
  if (error?.code === 'ERR_NETWORK') return 'Cannot reach the server. Is the backend running on port 8080?';
  return error?.message || 'Something went wrong';
}
