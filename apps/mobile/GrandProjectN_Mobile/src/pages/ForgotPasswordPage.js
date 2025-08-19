import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { globalStyles, COLORS } from '../styles/theme';

const API_URL = 'http://192.168.20.107:8888/api/auth/forgot-password';

const ForgotPasswordPage = ({ navigation }) => {
  const [email, setEmail] = useState('');

  const handleForgotPassword = async () => {
    try {
      await axios.post(API_URL, { email });
      Alert.alert('Thành công', 'Vui lòng kiểm tra email để đặt lại mật khẩu.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Gửi yêu cầu thất bại');
    }
  };

  return (
    <LinearGradient
      colors={[COLORS.background, '#0e0b1d']}
      style={styles.gradientContainer}
    >
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
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
});

export default ForgotPasswordPage;