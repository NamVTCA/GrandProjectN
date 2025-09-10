import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { AuthContext } from '../../features/auth/AuthContext';
import { colors, spacing, typography } from '../../styles/theme';

const ProfilePage = () => {
  // Lấy thông tin user và hàm signOut từ Context
  const { user, signOut } = useContext(AuthContext);

  // Fallback avatar nếu user không có
  const avatarUrl = user?.avatar || 'https://via.placeholder.com/150';

  return (
    <View style={styles.container}>
      <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      
      <Text style={styles.displayName}>
        {user?.username || 'Không có tên'}
      </Text>
      
      <Text style={styles.username}>
        @{user?.username || 'username'}
      </Text>

      {/* Nút Đăng xuất */}
      <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
        <Text style={styles.logoutButtonText}>Đăng xuất</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.large,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: spacing.medium,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  displayName: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.small,
  },
  username: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.large * 2,
  },
  logoutButton: {
    backgroundColor: colors.card,
    paddingVertical: spacing.medium,
    paddingHorizontal: spacing.large,
    borderRadius: spacing.small,
    borderWidth: 1,
    borderColor: colors.error,
  },
  logoutButtonText: {
    ...typography.body,
    color: colors.error,
    fontWeight: 'bold',
  },
});

export default ProfilePage;