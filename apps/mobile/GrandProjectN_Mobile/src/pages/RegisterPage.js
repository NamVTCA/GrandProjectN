import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { globalStyles, COLORS } from '../styles/theme';

const API_URL = 'http://192.168.20.107:8888/api/auth';

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
      Alert.alert('Lỗi', error.response?.data?.message || 'Đăng ký thất bại');
    }
  };

  return (
    <LinearGradient
      colors={[COLORS.background, '#0e0b1d']}
      style={styles.gradientContainer}
    >
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
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
});

export default RegisterPage;