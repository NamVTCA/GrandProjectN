import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8888/api', // URL Backend của bạn
});

// Tự động gắn token vào mỗi yêu cầu nếu có
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;