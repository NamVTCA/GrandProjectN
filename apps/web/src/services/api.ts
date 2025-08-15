import axios from 'axios';

// Create a single, configured axios instance
const api = axios.create({
  baseURL: import.meta.env?.VITE_API_URL || 'http://localhost:8888/api', // URL from your NestJS backend
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

// (optional) Response interceptor: chuẩn hoá lỗi để FE dễ xử lý
api.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject({
    status: err?.response?.status,
    message: err?.response?.data?.message || err?.message || 'Request error',
    raw: err,
  })
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

// ============================
// Block user
// ============================

export const BlocksApi = {
  async block(userId: string) {
    const { data } = await api.post(`/friends/block/${userId}`);
    return data;
  },
  async unblock(userId: string) {
    const { data } = await api.delete(`/friends/block/${userId}`);
    return data;
  },
  // Không có GET /friends/blocks → lấy tạm từ /friends/me (nếu backend trả blockedUsers)
  async list(): Promise<string[]> {
    try {
      const { data } = await api.get('/friends/me');
      // cố gắng suy luận các cấu trúc phổ biến
      if (Array.isArray(data?.blockedUsers)) {
        return data.blockedUsers.map((u: any) => u._id || u.id || String(u));
      }
      if (Array.isArray(data?.me?.blockedUsers)) {
        return data.me.blockedUsers.map((u: any) => u._id || u.id || String(u));
      }
      return [];
    } catch {
      return [];
    }
  },
};

// ============================
// Tạo nhóm chat
// ============================

export const RoomsApi = {
  // Backend nhận { name, memberIds }
  async createGroup(payload: { name: string; memberIds: string[] }) {
    const { data } = await api.post('/chat/rooms', payload);
    return data;
  },
};

// (tuỳ chọn) danh sách bạn bè từ /friends/me để hiển thị trong modal chọn thành viên
export const FriendsApi = {
  async me() {
    const { data } = await api.get('/friends/me');
    return data;
  },
  async remove(friendId: string) {
    const { data } = await api.delete(`/friends/${friendId}`);
    return data;
  },
};

export default api;
