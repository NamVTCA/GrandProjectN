// src/features/auth/AuthContext.tsx

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../api/apiClient';
import { User } from '../../types';

// Định nghĩa những gì mà Context sẽ cung cấp
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean; // Trạng thái để kiểm tra token lúc khởi động app
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

// Tạo Context
export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Tạo component Provider, nó sẽ "bọc" toàn bộ ứng dụng
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hàm này sẽ tự động chạy khi ứng dụng khởi động
  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        if (storedToken) {
          setToken(storedToken);
          // Gắn token vào header của mọi request API từ đây về sau
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          // Lấy thông tin user với token đó
          const { data } = await apiClient.get('/users/me');
          setUser(data);
        }
      } catch (e) {
        console.error('Failed to load token from storage', e);
      } finally {
        setIsLoading(false); // Hoàn tất việc kiểm tra
      }
    };

    loadToken();
  }, []);

  // Hàm xử lý logic đăng nhập
  const signIn = async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { accessToken, user } = response.data;

      // Lưu token và thông tin user vào state
      setToken(accessToken);
      setUser(user);

      // Gắn token vào header
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      // Lưu token vào bộ nhớ điện thoại để ghi nhớ đăng nhập
      await AsyncStorage.setItem('userToken', accessToken);
    } catch (error) {
      console.error('Sign in failed', error);
      throw error; // Ném lỗi ra để màn hình Login có thể bắt và hiển thị
    }
  };

  // Hàm xử lý logic đăng xuất
  const signOut = async () => {
    setUser(null);
    setToken(null);
    delete apiClient.defaults.headers.common['Authorization'];
    await AsyncStorage.removeItem('userToken');
  };

  // Cung cấp các giá trị và hàm này cho toàn bộ ứng dụng
  return (
    <AuthContext.Provider value={{ user, token, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};