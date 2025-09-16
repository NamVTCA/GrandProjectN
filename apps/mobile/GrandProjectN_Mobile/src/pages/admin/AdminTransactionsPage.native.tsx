// src/pages/admin/AdminTransactionsPage.native.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, Alert, TouchableOpacity } from 'react-native';
import api from '../../services/api';
import Button from '../../components/common/Button';


const AdminTransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payments/transactions');
      setTransactions(res.data);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Lỗi khi tải giao dịch');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async (orderId: string) => {
    try {
      const res = await api.get(`/payments/receipt/${orderId}`, { responseType: 'arraybuffer' });
      // convert to base64
      const base64 = Buffer.from(res.data).toString('base64');
      // For simplicity: open share dialog or save to file using RNFS (native)
      Alert.alert('Hệ thống', 'File hóa đơn đã được tải (base64). Triển khai lưu file tuỳ môi trường.');
      // If you want to save file:
      // const path = RNFS.DocumentDirectoryPath + `/receipt-${orderId}.pdf`;
      // await RNFS.writeFile(path, base64, 'base64');
      // Alert.alert('Lưu thành công', `Lưu tại ${path}`);
    } catch (err: any) {
      console.error(err);
      Alert.alert('Lỗi', err?.message || 'Không thể tải hóa đơn');
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  if (error) return <View style={styles.center}><Text>{error}</Text></View>;
  if (transactions.length === 0) return <View style={styles.center}><Text>Chưa có giao dịch nào.</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quản lý Giao dịch</Text>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600' }}>{item._id.substring(0,8)}...</Text>
              <Text>{item.user?.username}</Text>
              <Text>{item.coinPackage?.name}</Text>
              <Text>${item.amount}</Text>
              <Text>{new Date(item.createdAt).toLocaleString()}</Text>
            </View>
            {item.status === 'COMPLETED' ? (
              <Button onPress={() => handleDownloadReceipt(item._id)}>Tải hóa đơn</Button>
            ) : (
              <Text>N/A</Text>
            )}
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, padding: 12, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  row: { padding: 12, borderWidth: 1, borderColor: '#eee', marginBottom: 8, borderRadius: 8, flexDirection: 'row' }
});

export default AdminTransactionsPage;
