import React, { useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import axios from 'axios';
import { globalStyles, COLORS } from '../styles/theme';
import { useAuth } from '../features/auth/AuthContext';
import PostCard from './PostCard';

const Feed = forwardRef(({ onPostCreated }, ref) => {
  const { token, logout } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchFeed = useCallback(async () => {
    if (!token) return;
    setIsRefreshing(true);
    try {
      const response = await axios.get(`http://192.168.20.107:8888/api/posts/feed`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        Alert.alert("Phiên làm việc đã hết hạn", "Vui lòng đăng nhập lại.");
        logout();
      } else {
        Alert.alert('Lỗi', 'Không thể tải feed. Vui lòng kiểm tra kết nối mạng hoặc địa chỉ IP.');
        console.error('Lỗi tải feed:', error);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [token, logout]);

  useImperativeHandle(ref, () => ({
    fetchFeed,
  }));

  useEffect(() => {
    fetchFeed();
  }, [token, fetchFeed]);

  if (loading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      renderItem={({ item }) => <PostCard post={item} />}
      keyExtractor={item => item._id}
      showsVerticalScrollIndicator={false}
      onRefresh={fetchFeed}
      refreshing={isRefreshing}
    />
  );
});

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 200,
  },
});

export default Feed;