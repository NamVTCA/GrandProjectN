// src/pages/Auth/RegisterPage.tsx

import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { AuthContext } from '../../features/auth/AuthContext';
import { colors, spacing, typography } from '../../styles/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Định nghĩa kiểu cho navigation prop
type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
};

type RegisterPageNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

interface Props {
    navigation: RegisterPageNavigationProp;
}


const RegisterPage: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useContext(AuthContext);

  const handleRegister = async () => {
    if (!email || !password || !username || !displayName) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin.');
      return;
    }
    setIsLoading(true);
    try {
      await signUp({ email, username, displayName, password });
      Alert.alert(
        'Thành công!',
        'Tài khoản của bạn đã được tạo. Vui lòng đăng nhập.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      Alert.alert('Đăng ký thất bại', 'Email hoặc tên người dùng có thể đã tồn tại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Tạo tài khoản</Text>
      <TextInput
        style={styles.input}
        placeholder="Tên người dùng (username)"
        placeholderTextColor={colors.textSecondary}
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Tên hiển thị"
        placeholderTextColor={colors.textSecondary}
        value={displayName}
        onChangeText={setDisplayName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.textSecondary}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Mật khẩu"
        placeholderTextColor={colors.textSecondary}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={isLoading}>
         {isLoading ? <ActivityIndicator color={colors.text} /> : <Text style={styles.buttonText}>Đăng ký</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.linkText}>Đã có tài khoản? Đăng nhập ngay</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// Sử dụng lại các style tương tự LoginPage
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: spacing.large,
  },
  title: {
    ...typography.h1,
    color: colors.secondary, // Dùng màu nhấn phụ
    textAlign: 'center',
    marginBottom: spacing.large,
  },
  input: {
    backgroundColor: colors.card,
    color: colors.text,
    padding: spacing.medium,
    borderRadius: spacing.small,
    marginBottom: spacing.medium,
    fontSize: 16,
  },
  button: {
    backgroundColor: colors.secondary,
    padding: spacing.medium,
    borderRadius: spacing.small,
    alignItems: 'center',
  },
  buttonText: {
    ...typography.body,
    fontWeight: 'bold',
  },
  linkText: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.large,
    padding: spacing.small,
  },
});

export default RegisterPage;