import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';
import { useAuth } from '../features/auth/AuthContext';
import { globalStyles, COLORS } from '../styles/theme';

const API_URL = 'http://192.168.1.28:8888/api/auth/me';

const HomePage = () => {
  const { logout, token, user } = useAuth();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (token) {
      fetchUserData();
    }
  }, [token]);

  const fetchUserData = async () => {
    try {
      const response = await axios.get(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUserData(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        Alert.alert("Phiên làm việc đã hết hạn", "Vui lòng đăng nhập lại.");
        logout();
      } else {
        console.error('Lỗi lấy thông tin người dùng:', error.response?.data);
        Alert.alert('Lỗi', 'Không thể tải thông tin người dùng.');
      }
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Chào mừng, {user?.username || 'Bạn'}!</Text>
      <Text style={{ color: COLORS.text, marginBottom: 20 }}>Email của bạn: {user?.email}</Text>
      <TouchableOpacity style={globalStyles.button} onPress={handleLogout}>
        <Text style={globalStyles.buttonText}>Đăng xuất</Text>
      </TouchableOpacity>
    </View>
  );
};

export default HomePage;