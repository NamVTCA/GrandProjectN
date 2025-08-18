import axios from 'axios';

// ⚠️ Không đặt Content-Type mặc định ở đây (để upload FormData không bị lỗi)
const api = axios.create({
  baseURL: import.meta.env?.VITE_API_URL || 'http://localhost:8888/api',
});

// Gắn token + xử lý Content-Type động
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;

    const isFormData =
      typeof FormData !== 'undefined' && config.data instanceof FormData;

    if (isFormData) {
      // Để browser tự set multipart/form-data; boundary=...
      if (config.headers) delete (config.headers as any)['Content-Type'];
    } else {
      if (config.headers && !config.headers['Content-Type']) {
        (config.headers as any)['Content-Type'] = 'application/json';
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (res) => res,
  (err) =>
    Promise.reject({
      status: err?.response?.status,
      message: err?.response?.data?.message || err?.message || 'Request error',
      raw: err,
    }),
);

export const chatWithBot = async (message: string): Promise<{ reply: string }> => {
  const res = await api.post('/chatbot', { message });
  if (typeof res.data === 'string') return { reply: res.data };
  return res.data;
};

export const BlocksApi = {
  async block(userId: string) {
    const { data } = await api.post(`/friends/block/${userId}`);
    return data;
  },
  async unblock(userId: string) {
    const { data } = await api.delete(`/friends/block/${userId}`);
    return data;
  },
  async list(): Promise<string[]> {
    try {
      const { data } = await api.get('/friends/me');
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

export const RoomsApi = {
  async createGroup(payload: { name?: string; memberIds: string[]; avatarFile?: File | null }) {
    if (payload.avatarFile) {
      const form = new FormData();
      if (payload.name) form.append('name', payload.name);
      payload.memberIds.forEach((id) => form.append('memberIds', id));
      // 👇 tên field phải khớp backend (thường là 'avatar')
      form.append('avatar', payload.avatarFile);
      const { data } = await api.post('/chat/rooms', form);
      return data;
    } else {
      const { data } = await api.post('/chat/rooms', {
        name: payload.name,
        memberIds: payload.memberIds,
      });
      return data;
    }
  },
};

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
