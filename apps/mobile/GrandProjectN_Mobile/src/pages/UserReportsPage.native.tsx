import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import api from '../services/api';

interface Report {
  _id: string;
  type: string;
  reason: string;
  createdAt: string;
  reporter: {
    username: string;
    avatar: string;
  };
}

const UserReportsPage: React.FC = () => {
  const route = useRoute();
  const { userId } = route.params as { userId: string };
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get<Report[]>(`/reports/target/${userId}`);
        setReports(res.data);
      } catch (err) {
        console.error('Error fetching reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [userId]);

  if (loading) return <Text style={styles.loading}>Đang tải...</Text>;

  if (reports.length === 0) return <Text style={styles.noReports}>Không có báo cáo nào cho người dùng này.</Text>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Báo cáo về người dùng</Text>
      {reports.map(report => (
        <View key={report._id} style={styles.reportItem}>
          <View style={styles.reportHeader}>
            <Image source={{ uri: report.reporter.avatar }} style={styles.avatar} />
            <Text style={styles.username}>@{report.reporter.username}</Text>
            <Text style={styles.type}>({report.type})</Text>
            <Text style={styles.time}>{new Date(report.createdAt).toLocaleString()}</Text>
          </View>
          <Text style={styles.reason}>{report.reason}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  loading: {
    textAlign: 'center',
    marginTop: 20,
  },
  noReports: {
    textAlign: 'center',
    marginTop: 20,
  },
  reportItem: {
    backgroundColor: '#ffffff',
    padding: 12,
    marginBottom: 10,
    borderRadius: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  username: {
    fontWeight: '500',
    marginRight: 10,
  },
  type: {
    fontStyle: 'italic',
    color: '#777',
    marginRight: 10,
  },
  time: {
    color: 'gray',
    fontSize: 12,
    marginLeft: 'auto',
  },
  reason: {
    fontStyle: 'italic',
  },
});

export default UserReportsPage;