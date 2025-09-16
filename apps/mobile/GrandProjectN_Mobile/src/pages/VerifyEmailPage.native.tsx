import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useRoute } from '@react-navigation/native';
import api from '../services/api';

const VerifyEmailPage: React.FC = () => {
  const route = useRoute();
  const { token } = route.params as { token: string };
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Đang xác thực email của bạn...');

  useEffect(() => {
    if (token) {
      api.get(`/auth/verify-email?token=${token}`)
        .then(() => {
          setStatus('success');
          setMessage('Xác thực thành công! Giờ bạn có thể đăng nhập.');
        })
        .catch((err) => {
          setStatus('error');
          setMessage(err.response?.data?.message || 'Token không hợp lệ hoặc đã hết hạn.');
        });
    } else {
      setStatus('error');
      setMessage('Không tìm thấy token xác thực.');
    }
  }, [token]);

  return (
    <View style={styles.container}>
      <View style={[styles.statusCard, styles[status]]}>
        <Text style={styles.statusTitle}>
          {status === 'success' ? 'Thành công!' : (status === 'error' ? 'Thất bại!' : 'Đang xử lý...')}
        </Text>
        <Text style={styles.message}>{message}</Text>
        {status !== 'verifying' && (
          <TouchableOpacity 
            style={styles.button}
            onPress={() => Linking.openURL('myapp://login')}
          >
            <Text style={styles.buttonText}>Về trang Đăng nhập</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#121212',
  },
  statusCard: {
    backgroundColor: '#1e1e1e',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    maxWidth: 500,
    borderTopWidth: 5,
  },
  success: {
    borderTopColor: '#4caf50',
  },
  error: {
    borderTopColor: '#dc3545',
  },
  verifying: {
    borderTopColor: '#007bff',
  },
  statusTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#ffffff',
  },
  message: {
    color: '#b0b0b0',
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    minWidth: 150,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});

export default VerifyEmailPage;