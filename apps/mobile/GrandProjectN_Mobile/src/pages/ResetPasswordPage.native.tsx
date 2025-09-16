import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import api from '../services/api';

type RouteParams = {
  token?: string;
};

type RootStackParamList = {
  Login: undefined;
  ResetPassword: { token?: string };
};

type ResetPasswordScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const ResetPasswordPage: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation<ResetPasswordScreenNavigationProp>();
  const params = route.params as RouteParams;
  
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setMessage('');
    
    if (!params?.token) {
      setMessage('Token không hợp lệ');
      setLoading(false);
      return;
    }

    try {
      await api.post(`/auth/reset-password/${params.token}`, { password });
      setMessage('Đặt lại mật khẩu thành công!');
      
      setTimeout(() => {
        navigation.navigate('Login');
      }, 2000);
    } catch (err) {
      setMessage('Token không hợp lệ hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đặt lại Mật khẩu</Text>
      
      {message ? (
        <Text style={[styles.message, message.includes('thành công') ? styles.successMessage : styles.errorMessage]}>
          {message}
        </Text>
      ) : (
        <>
          <TextInput
            label="Mật khẩu mới"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry
            mode="outlined"
          />
          
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Xác nhận
          </Button>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  input: {
    marginBottom: 20,
    backgroundColor: 'white',
  },
  button: {
    paddingVertical: 8,
  },
  message: {
    textAlign: 'center',
    fontSize: 16,
    padding: 20,
    borderRadius: 8,
  },
  successMessage: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  errorMessage: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
  },
});

export default ResetPasswordPage;