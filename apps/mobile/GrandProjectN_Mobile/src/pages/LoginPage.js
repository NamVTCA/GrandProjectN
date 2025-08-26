import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../features/auth/AuthContext';
import { globalStyles, COLORS } from '../styles/theme';

const API_URL = 'http://192.168.20.107:8888/api/auth/login';

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
      Alert.alert('Lỗi', error.response?.data?.message || 'Đăng nhập thất bại');
    }
  };

  return (
    <LinearGradient
      colors={[COLORS.background, '#0e0b1d']}
      style={styles.gradientContainer}
    >
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
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
});

export default LoginPage;