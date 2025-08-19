import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { globalStyles, COLORS } from '../styles/theme';
import { useAuth } from '../features/auth/AuthContext';

const FriendsPage = () => {
  const { token, user, logout } = useAuth();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchFriends();
    }
  }, [token]);

  const fetchFriends = async () => {
    try {
      const response = await axios.get(`http://192.168.20.107:8888/api/users/get/friends`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFriends(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        Alert.alert("Phiên làm việc đã hết hạn", "Vui lòng đăng nhập lại.");
        logout();
      } else {
        console.error('Lỗi lấy danh sách bạn bè:', error);
        Alert.alert('Lỗi', error.response?.data?.message || 'Không thể tải danh sách bạn bè.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderFriendItem = ({ item }) => (
    <TouchableOpacity style={styles.friendItem}>
      <Text style={styles.friendName}>{item.username}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bạn bè</Text>
      <FlatList
        data={friends}
        renderItem={renderFriendItem}
        keyExtractor={item => item._id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 10,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  title: {
    ...globalStyles.title,
    textAlign: 'left',
  },
  friendItem: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: COLORS.card,
  },
  friendName: {
    color: COLORS.text,
    fontWeight: 'bold',
  },
});

export default FriendsPage;