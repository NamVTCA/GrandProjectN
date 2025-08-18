import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import { useAuth } from '../features/auth/AuthContext';
import { globalStyles, COLORS } from '../styles/theme'; // Import các kiểu dáng và màu sắc

const API_URL = 'http://192.168.1.28:8888/api/auth/login';

const LoginPage = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleLogin = async () => {
    try {
      const response = await axios.post(API_URL, { email, password });
      login(response.data.accessToken);
      Alert.alert('Thành công', 'Đăng nhập thành công!');
    } catch (error) {
      console.error('Lỗi đăng nhập:', error.response?.data);
      Alert.alert('Lỗi', error.response?.data?.message || 'Đăng nhập thất bại');
    }
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Đăng nhập</Text>
      <TextInput
        style={globalStyles.input}
        placeholder="Email"
        placeholderTextColor={COLORS.placeholder}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={globalStyles.input}
        placeholder="Mật khẩu"
        placeholderTextColor={COLORS.placeholder}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={globalStyles.button} onPress={handleLogin}>
        <Text style={globalStyles.buttonText}>Đăng nhập</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
        <Text style={globalStyles.linkText}>Quên mật khẩu?</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={globalStyles.linkText}>Chưa có tài khoản? Đăng ký ngay</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LoginPage;