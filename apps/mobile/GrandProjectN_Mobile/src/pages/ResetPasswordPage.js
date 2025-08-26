import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { globalStyles, COLORS } from '../styles/theme';

const API_URL = 'http://192.168.20.107:8888/api/auth/reset-password';

const ResetPasswordPage = ({ navigation }) => {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');

  const handleResetPassword = async () => {
    try {
      await axios.post(`${API_URL}/${token}`, { password });
      Alert.alert('Thành công', 'Mật khẩu của bạn đã được đặt lại!');
      navigation.navigate('Login'); // Điều hướng về màn hình đăng nhập
    } catch (error) {
      console.error('Lỗi đặt lại mật khẩu:', error.response?.data);
      Alert.alert('Lỗi', error.response?.data?.message || 'Đặt lại mật khẩu thất bại');
    }
  };

  return (
    <LinearGradient
      colors={[COLORS.background, '#0e0b1d']}
      style={styles.gradientContainer}
    >
      <View style={globalStyles.container}>
        <Text style={globalStyles.title}>Đặt lại Mật khẩu</Text>
        <TextInput
          style={globalStyles.input}
          placeholder="Nhập token từ email"
          placeholderTextColor={COLORS.placeholder}
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
        />
        <TextInput
          style={globalStyles.input}
          placeholder="Mật khẩu mới"
          placeholderTextColor={COLORS.placeholder}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity style={globalStyles.button} onPress={handleResetPassword}>
          <Text style={globalStyles.buttonText}>Đặt lại Mật khẩu</Text>
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

export default ResetPasswordPage;