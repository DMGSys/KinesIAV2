import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kinesia_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('kinesia_token');
      localStorage.removeItem('kinesia_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const setAuth = (token: string, user: object) => {
  localStorage.setItem('kinesia_token', token);
  localStorage.setItem('kinesia_user', JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem('kinesia_token');
  localStorage.removeItem('kinesia_user');
};

export const getAuth = () => {
  const token = localStorage.getItem('kinesia_token');
  const userStr = localStorage.getItem('kinesia_user');
  if (!token || !userStr) return null;
  return { token, user: JSON.parse(userStr) };
};

export const authHeader = () => {
  const token = localStorage.getItem('kinesia_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};
