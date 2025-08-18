import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import { globalStyles, COLORS } from '../styles/theme';

const API_URL = 'http://192.168.1.28:8888/api/auth/forgot-password';

const ForgotPasswordPage = ({ navigation }) => {
  const [email, setEmail] = useState('');

  const handleForgotPassword = async () => {
    try {
      await axios.post(API_URL, { email });
      Alert.alert('Thành công', 'Vui lòng kiểm tra email để đặt lại mật khẩu.');
      navigation.goBack();
    } catch (error) {
      console.error('Lỗi quên mật khẩu:', error.response?.data);
      Alert.alert('Lỗi', error.response?.data?.message || 'Gửi yêu cầu thất bại');
    }
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Quên mật khẩu</Text>
      <TextInput
        style={globalStyles.input}
        placeholder="Nhập email của bạn"
        placeholderTextColor={COLORS.placeholder}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TouchableOpacity style={globalStyles.button} onPress={handleForgotPassword}>
        <Text style={globalStyles.buttonText}>Gửi email đặt lại</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ForgotPasswordPage;