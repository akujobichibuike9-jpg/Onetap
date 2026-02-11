import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      const isAuthRequest = err.config?.url?.includes('/auth/');
      const isAuthPage = window.location.pathname === '/auth' || window.location.pathname === '/';
      if (!isAuthRequest && !isAuthPage) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth';
      }
    }
    return Promise.reject(err);
  }
);

export default api;