import axios from 'axios';

// Centralized Axios instance for all ShopSense API calls
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attaches the JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ss_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handles 401 (expired/invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired — clear local storage
      localStorage.removeItem('ss_token');
      localStorage.removeItem('ss_user');
      localStorage.removeItem('ss_role');
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
