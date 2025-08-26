import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { globalStyles, COLORS } from '../styles/theme';
import { useAuth } from '../features/auth/AuthContext';

const GroupsPage = () => {
  const { token, logout } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchGroups();
    }
  }, [token]);

  const fetchGroups = async () => {
    try {
      const response = await axios.get(`http://192.168.20.34:8888/api/groups/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGroups(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        Alert.alert("Phiên làm việc đã hết hạn", "Vui lòng đăng nhập lại.");
        logout();
      } else {
        console.error('Lỗi lấy danh sách nhóm:', error);
        Alert.alert('Lỗi', error.response?.data?.message || 'Không thể tải danh sách nhóm.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderGroupItem = ({ item }) => (
    <TouchableOpacity style={styles.groupItem}>
      <Text style={styles.groupName}>{item.name}</Text>
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
      <Text style={styles.title}>Nhóm của tôi</Text>
      <FlatList
        data={groups}
        renderItem={renderGroupItem}
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
  groupItem: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: COLORS.card,
  },
  groupName: {
    color: COLORS.text,
    fontWeight: 'bold',
  },
});

export default GroupsPage;