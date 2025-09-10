// src/pages/Auth/LoginPage.tsx

import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { AuthContext } from '../../features/auth/AuthContext';
import { colors, spacing, typography } from '../../styles/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
};

type LoginPageNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

interface Props {
    navigation: LoginPageNavigationProp;
}

const LoginPage: React.FC<Props> = ({ navigation }) => { // Chúng ta sẽ thêm navigation sau
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { signIn } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }
    setIsLoggingIn(true);
    try {
      await signIn(email, password);
      // Đăng nhập thành công, app sẽ tự chuyển màn hình (do AuthContext)
    } catch (error) {
      Alert.alert('Đăng nhập thất bại', 'Email hoặc mật khẩu không chính xác.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chào mừng trở lại!</Text>
      <Text style={styles.subtitle}>Đăng nhập để tiếp tục</Text>
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
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoggingIn}>
        {isLoggingIn ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <Text style={styles.buttonText}>Đăng nhập</Text>
        )}
      </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.linkText}>Chưa có tài khoản? Tạo ngay</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: spacing.large,
  },
    linkText: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.large,
    padding: spacing.small,
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.small,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.large,
  },
  input: {
    backgroundColor: colors.card,
    color: colors.text,
    padding: spacing.medium,
    borderRadius: spacing.small,
    marginBottom: spacing.medium,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 16,
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.medium,
    borderRadius: spacing.small,
    alignItems: 'center',
    marginTop: spacing.small,
  },
  buttonText: {
    ...typography.body,
    fontWeight: 'bold',
  },
});

export default LoginPage;