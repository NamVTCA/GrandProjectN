import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = 'http://192.168.1.28:8888/api/auth';

  useEffect(() => {
    const loadState = async () => {
      const storedToken = await AsyncStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        // Tải thông tin người dùng ngay sau khi có token
        try {
          const response = await axios.get(`${API_URL}/me`, {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          });
          setUser(response.data);
        } catch (error) {
          console.error("Lỗi tải thông tin người dùng:", error);
          await AsyncStorage.removeItem('token');
          setToken(null);
        }
      }
      setIsLoading(false);
    };
    loadState();
  }, []);

  const login = async (newToken) => {
    await AsyncStorage.setItem('token', newToken);
    setToken(newToken);
    // Tải thông tin người dùng ngay sau khi đăng nhập
    try {
      const response = await axios.get(`${API_URL}/me`, {
        headers: {
          Authorization: `Bearer ${newToken}`,
        },
      });
      setUser(response.data);
    } catch (error) {
      console.error("Lỗi tải thông tin người dùng sau khi đăng nhập:", error);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ token, isAuthenticated, login, logout, isLoading, user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};