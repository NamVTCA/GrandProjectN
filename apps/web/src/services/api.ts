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
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ✅ Thêm hàm gọi API chatbot ở đây
export const chatWithBot = async (message: string): Promise<{ reply: string }> => {
  const res = await api.post('/chatbot', { message });

  // ✅ Kiểm tra và trả về đúng dạng object có thuộc tính reply
  if (typeof res.data === 'string') {
    return { reply: res.data }; // ← FIX lỗi
  }

  return res.data; // Nếu backend đã trả về { reply: string } thì vẫn đúng
};


export default api;
