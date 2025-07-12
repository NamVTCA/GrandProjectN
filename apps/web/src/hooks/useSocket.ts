import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../features/auth/AuthContext';

const SOCKET_URL = 'http://localhost:8888'; // URL Backend của bạn

export const useSocket = (namespace: string) => {
  const { token, user } = useAuth();
  // Dùng useRef để socket không bị tạo lại mỗi lần re-render
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token || !user) {
      // Nếu không có token hoặc user, ngắt kết nối cũ nếu có
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Chỉ tạo socket mới nếu chưa có
    if (!socketRef.current) {
      socketRef.current = io(`${SOCKET_URL}/${namespace}`, {
        // Gửi token và userId qua query để PresenceGateway có thể dùng
        query: { userId: user._id },
        auth: {
          token: `Bearer ${token}`
        }
      });
    }

    // Hàm dọn dẹp khi component unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [token, user, namespace]);

  return socketRef.current;
};