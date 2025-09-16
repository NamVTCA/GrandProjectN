import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../features/auth/AuthContext';
import Config from 'react-native-config';

// Lấy URL BE từ .env, fallback localhost
const RAW_URL = Config.API_BASE_URL || 'http://localhost:8888/api';
// Bỏ đuôi /api nếu có để dùng cho socket
const SOCKET_URL = RAW_URL.replace(/\/api\/?$/, '');

export const useSocket = (namespace?: string) => {
  const { token, user } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const endpoint = namespace ? `${SOCKET_URL}/${namespace}` : SOCKET_URL;

    if (!socketRef.current) {
      socketRef.current = io(endpoint, {
        transports: ['websocket'],
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 500,
        reconnectionDelayMax: 5000,
        auth: { token },
        query: { token, userId: user._id },
      });

      socketRef.current.auth = { token };
      socketRef.current.connect();

      socketRef.current.on('connect_error', (err) => {
        console.warn('[socket] connect_error', err?.message);
      });
    } else {
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
