// src/pages/admin/ContentManagementPage.native.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import api from '../../services/api';
import Button from '../../components/common/Button';


type Report = {
  _id: string;
  type: 'POST'|'COMMENT'|'USER';
  targetId: string;
  reason: string;
  createdAt: string;
  reporter: { username: string; avatar?: string };
};

type ModeratedPost = any;
type ModeratedComment = any;

const ContentManagementPage: React.FC = () => {
  const [posts, setPosts] = useState<ModeratedPost[]>([]);
  const [comments, setComments] = useState<ModeratedComment[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchQueue(); }, []);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const [queueRes, reportsRes] = await Promise.all([
        api.get('/admin/moderation-queue'),
        api.get('/reports/all'),
      ]);
      setPosts(queueRes.data.posts || []);
      setComments(queueRes.data.comments || []);
      setReports(reportsRes.data || []);
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (type: 'posts'|'comments', id: string, status: 'APPROVED'|'REJECTED') => {
    try {
      await api.patch(`/admin/${type}/${id}/status`, { status });
      Alert.alert('Thành công', `Đã ${status === 'APPROVED' ? 'phê duyệt' : 'từ chối'}`);
      fetchQueue();
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi', 'Có lỗi xảy ra');
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  return (
    <ScrollView contentContainerStyle={{ padding: 12 }}>
      <Text style={styles.title}>Quản lý Nội dung</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bài đăng chờ duyệt ({posts.length})</Text>
        {posts.length > 0 ? posts.map(p => (
          <View key={p._id} style={styles.card}>
            <Text style={{ fontWeight: '700' }}>@{p.author?.username}</Text>
            <Text style={{ marginVertical: 6 }}>{p.content}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button onPress={() => handleAction('posts', p._id, 'APPROVED')}>Duyệt</Button>
              <Button onPress={() => handleAction('posts', p._id, 'REJECTED')} variant="secondary">Từ chối</Button>
            </View>
          </View>
        )) : <Text>Không có bài đăng nào chờ duyệt.</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tất cả báo cáo ({reports.length})</Text>
        {reports.map(r => (
          <View key={r._id} style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '700' }}>@{r.reporter.username}</Text>
              <Text>{new Date(r.createdAt).toLocaleString()}</Text>
            </View>
            <Text>Lý do: {r.reason}</Text>
            <Text>Loại: {r.type}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bình luận chờ duyệt ({comments.length})</Text>
        {comments.length > 0 ? comments.map(c => (
          <View key={c._id} style={styles.card}>
            <Text style={{ fontWeight: '700' }}>@{c.author?.username}</Text>
            <Text style={{ marginVertical: 6 }}>{c.content}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button onPress={() => handleAction('comments', c._id, 'APPROVED')}>Duyệt</Button>
              <Button onPress={() => handleAction('comments', c._id, 'REJECTED')} variant="secondary">Từ chối</Button>
            </View>
          </View>
        )) : <Text>Không có bình luận nào chờ duyệt.</Text>}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  card: { padding: 12, borderWidth: 1, borderColor: '#eee', borderRadius: 8, marginBottom: 8 }
});

export default ContentManagementPage;
