import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { globalStyles, COLORS } from '../styles/theme';
import { useAuth } from '../features/auth/AuthContext';

const Rightbar = () => {
  const { token } = useAuth();
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    if (token) {
      fetchFriends();
    }
  }, [token]);

  const fetchFriends = async () => {
    try {
      const response = await axios.get(`http://192.168.20.34:8888/api/users/get/friends`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFriends(response.data);
    } catch (error) {
      console.error('Lỗi lấy danh sách bạn bè:', error);
    }
  };

  const renderFriendItem = ({ item }) => (
    <TouchableOpacity style={styles.friendItem}>
      <Text style={styles.friendName}>{item.username}</Text>
    </TouchableOpacity>
  );

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
    flex: 0.5,
    backgroundColor: COLORS.card,
    padding: 10,
    borderLeftWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  friendItem: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 5,
    backgroundColor: COLORS.background,
  },
  friendName: {
    color: COLORS.text,
  },
});

export default Rightbar;