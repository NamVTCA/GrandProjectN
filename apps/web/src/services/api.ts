import axios from 'axios';

// Create a single, configured axios instance
const api = axios.create({
  baseURL: 'http://localhost:8888/api', // URL from your NestJS backend
  headers: {
    'Content-Type': 'application/json',
  },
});

// Use an interceptor to automatically attach the auth token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // Ensure the 'Authorization' header is set correctly
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Handle request errors
    return Promise.reject(error);
  },
);

export default api;
