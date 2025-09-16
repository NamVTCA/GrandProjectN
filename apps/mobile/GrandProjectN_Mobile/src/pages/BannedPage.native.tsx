// path: components/BannedPage.native.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const BannedPage: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🚫</Text>
      <Text style={styles.title}>Tài khoản của bạn đã bị khóa</Text>
      <Text style={styles.subtitle}>
        Vui lòng liên hệ với quản trị viên nếu bạn nghĩ đây là nhầm lẫn.
      </Text>
    </View>
  );
};

export default BannedPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8d7da',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    color: '#721c24',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    color: '#721c24',
    fontSize: 14,
    textAlign: 'center',
  },
});
