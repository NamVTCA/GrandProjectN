import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../features/auth/AuthContext';

// Lấy URL BE từ .env, fallback localhost
const RAW_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8888/api';
// Bỏ đuôi /api nếu có để dùng cho socket
const SOCKET_URL = RAW_URL.replace(/\/api\/?$/, '');

export const useSocket = (namespace?: string) => {
  const { token, user } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Nếu chưa đăng nhập -> ngắt kết nối socket cũ
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const endpoint = namespace ? `${SOCKET_URL}/${namespace}` : SOCKET_URL;

    if (!socketRef.current) {
      // an toàn kép: gửi token qua auth và query
      socketRef.current = io(endpoint, {
        transports: ['websocket'],
        autoConnect: false,               // connect thủ công để chắc chắn set auth xong
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 500,
        reconnectionDelayMax: 5000,
        auth: {
          token,                         // KHÔNG cần "Bearer "
        },
        query: {
          token,                         // fallback nếu server đọc query
          userId: user._id,              // nếu Presence cần
        },
      });

      // BẮT BUỘC: đặt/ghi đè auth ngay trước khi connect (trường hợp token đổi)
      socketRef.current.auth = { token };
      socketRef.current.connect();

      socketRef.current.on('connect_error', (err) => {
        console.warn('[socket] connect_error', err?.message);
      });
    } else {
      // nếu socket đã tồn tại mà token thay đổi, cập nhật lại và reconnect
      socketRef.current.auth = { token };
      if (!socketRef.current.connected) {
        socketRef.current.connect();
      }
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [token, user, namespace]);

  return socketRef.current;
};
