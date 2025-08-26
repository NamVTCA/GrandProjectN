import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { globalStyles, COLORS } from '../styles/theme';
import { useAuth } from '../features/auth/AuthContext';

const SidebarLeft = () => {
  const { token } = useAuth();
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    if (token) {
      fetchGroups();
    }
  }, [token]);

  const fetchGroups = async () => {
    try {
      const response = await axios.get(`http://192.168.20.34:8888/api/groups/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGroups(response.data);
    } catch (error) {
      console.error('Lỗi lấy danh sách nhóm:', error);
    }
  };

  const renderGroupItem = ({ item }) => (
    <TouchableOpacity style={styles.groupItem}>
      <Text style={styles.groupName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nhóm</Text>
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
    flex: 0.5,
    backgroundColor: COLORS.card,
    padding: 10,
    borderRightWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  groupItem: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 5,
    backgroundColor: COLORS.background,
  },
  groupName: {
    color: COLORS.text,
  },
});

export default SidebarLeft;