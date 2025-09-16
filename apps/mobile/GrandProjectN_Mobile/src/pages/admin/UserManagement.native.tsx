// src/pages/admin/UserManagementPage.native.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import api from '../../services/api';
import Button from '../../components/common/Button';


interface AdminUserView {
  _id: string;
  username: string;
  email: string;
  globalRole: 'USER'|'MODERATOR'|'ADMIN';
  accountStatus: 'ACTIVE'|'SUSPENDED'|'BANNED';
  createdAt: string;
}

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data || []);
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi', 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId: string, action: 'warn'|'suspend'|'ban'|'restore') => {
    let payload: any = {};
    if (action === 'warn' || action === 'suspend' || action === 'ban') {
      // in RN we use prompt alternative: simple Alert.prompt (iOS only) — use quick Alert for simplicity
      const reason = 'Hành động bởi admin'; // you can implement modal to capture reason
      payload.reason = reason;
    }
    if (action === 'suspend') {
      payload.durationInDays = 7; // default 7 days - to collect properly, implement modal
    }
    try {
      await api.post(action === 'restore' ? `/admin/users/${userId}/restore` : `/admin/users/${userId}/${action}`, payload);
      fetchUsers();
      Alert.alert('Thành công', 'Hành động đã thực hiện');
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi', 'Không thể thực hiện hành động');
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large"/></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quản lý Người dùng</Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item._id}
        renderItem={({item}) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700' }}>{item.username}</Text>
              <Text>{item.email}</Text>
              <Text>{item.globalRole} • {item.accountStatus}</Text>
              <Text>Ngày tham gia: {new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
            <View style={{ justifyContent: 'space-between' }}>
              <Button onPress={() => handleAction(item._id, 'warn')}>Cảnh cáo</Button>
              <Button onPress={() => handleAction(item._id, 'suspend')} variant="secondary">Tạm khóa</Button>
              <Button onPress={() => handleAction(item._id, 'ban')} variant="secondary">Khóa</Button>
              <Button onPress={() => handleAction(item._id, 'restore')}>Khôi phục</Button>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, padding: 12, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  row: { padding: 12, borderWidth: 1, borderColor: '#eee', borderRadius: 8, marginBottom: 8, flexDirection: 'row' }
});

export default UserManagementPage;
