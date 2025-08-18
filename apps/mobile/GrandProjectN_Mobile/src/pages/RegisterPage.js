import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import { globalStyles, COLORS } from '../styles/theme';

const API_URL = 'http://192.168.1.28:8888/api/auth/register';

const RegisterPage = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleRegister = async () => {
    try {
      await axios.post(`${API_URL}/register`, {
        email,
        password,
        name,
        username: name,
      });
      Alert.alert('Thành công', 'Đăng ký thành công! Vui lòng kiểm tra email để xác minh.');
      navigation.navigate('Login');
    } catch (error) {
      console.error('Lỗi đăng ký:', error.response?.data);
      Alert.alert('Lỗi', error.response?.data?.message || 'Đăng ký thất bại');
    }
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Đăng ký</Text>
      <TextInput
        style={globalStyles.input}
        placeholder="Tên người dùng"
        placeholderTextColor={COLORS.placeholder}
        value={name}
        onChangeText={setName}
      />
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
      <TouchableOpacity style={globalStyles.button} onPress={handleRegister}>
        <Text style={globalStyles.buttonText}>Đăng ký</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={globalStyles.linkText}>Đã có tài khoản? Đăng nhập</Text>
      </TouchableOpacity>
    </View>
  );
};

export default RegisterPage;