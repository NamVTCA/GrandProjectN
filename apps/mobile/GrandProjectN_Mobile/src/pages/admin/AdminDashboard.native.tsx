// src/pages/admin/AdminDashboardPage.native.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image,
  ActivityIndicator, Alert
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker'; // if using Expo, use expo-image-picker
import api from '../../services/api';
import Button from '../../components/common/Button';

interface Interest { _id: string; name: string }
interface ShopItem { _id: string; name: string; description: string; type: string; price: number; assetUrl?: string }

const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>({});
  const [reports, setReports] = useState<any[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    type: 'AVATAR_FRAME',
    price: 0,
    asset: null as any,
  });
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [newInterest, setNewInterest] = useState('');
  const [newPackageCoins, setNewPackageCoins] = useState<number | null>(null);
  const [existingPackages, setExistingPackages] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, reportsRes, packagesRes, interestsRes, shopItemsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/reports/all'),
        api.get('/coin-packages'),
        api.get('/interests'),
        api.get('/admin/shop/items'),
      ]);
      setStats(statsRes.data);
      setReports(reportsRes.data);
      setExistingPackages(packagesRes.data.map((p: any) => p.packageId));
      setInterests(interestsRes.data);
      setShopItems(shopItemsRes.data);
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const res = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
      if (res.didCancel) return;
      const asset = res.assets && res.assets[0];
      if (asset?.uri) {
        setPreviewUri(asset.uri);
        setNewItem(prev => ({ ...prev, asset }));
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi', 'Không thể chọn ảnh');
    }
  };

  const handleCreateItem = async () => {
    try {
      const form = new FormData();
      form.append('name', newItem.name);
      form.append('description', newItem.description);
      form.append('type', newItem.type);
      form.append('price', String(newItem.price));
      if (newItem.asset) {
        // react-native image file format
        form.append('file', {
          uri: newItem.asset.uri,
          name: newItem.asset.fileName || 'upload.jpg',
          type: newItem.asset.type || 'image/jpeg',
        } as any);
      }
      await api.post('/admin/shop/items', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Alert.alert('Thành công', 'Tạo vật phẩm thành công');
      setNewItem({ name: '', description: '', type: 'AVATAR_FRAME', price: 0, asset: null });
      setPreviewUri(null);
      fetchData();
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi', 'Không thể tạo vật phẩm');
    }
  };

  const handleDeleteItem = (id: string) => {
    Alert.alert('Xác nhận', 'Bạn có chắc muốn xoá?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xoá', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/admin/shop/items/${id}`);
            Alert.alert('Xóa', 'Xóa thành công');
            fetchData();
          } catch (err) {
            console.error(err);
            Alert.alert('Lỗi', 'Không thể xóa');
          }
        }
      }
    ]);
  };

  const handleCreateCoinPackage = async () => {
    if (!newPackageCoins) return;
    const id = `packed_${newPackageCoins}_coin`;
    const name = `Gói ${newPackageCoins} Coins`;
    const price = (newPackageCoins / 100) * 10000;
    try {
      await api.post('/coin-packages', { packageId: id, name, coinsAmount: newPackageCoins, price, currency: 'VND' });
      Alert.alert('Thành công', 'Tạo gói coin thành công');
      setNewPackageCoins(null);
      fetchData();
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi', 'Không thể tạo gói coin');
    }
  };

  const handleCreateInterest = async () => {
    if (!newInterest.trim()) return;
    try {
      await api.post('/admin/interests', { name: newInterest });
      Alert.alert('Thành công', 'Tạo sở thích thành công');
      setNewInterest('');
      fetchData();
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi', 'Không thể tạo sở thích');
    }
  };

  const handleDeleteInterest = (id: string) => {
    Alert.alert('Xác nhận', 'Bạn có chắc muốn xoá?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xoá', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/admin/interests/${id}`);
            fetchData();
          } catch (err) {
            console.error(err);
            Alert.alert('Lỗi', 'Không thể xóa sở thích');
          }
        }
      }
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Bảng điều khiển Admin</Text>

      <View style={styles.grid}>
        {['Người dùng', 'Bài viết', 'Chờ duyệt', 'Bị khóa'].map((label, i) => (
          <View style={styles.statBox} key={i}>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={styles.statValue}>{[stats.totalUsers, stats.totalPosts, stats.pendingModeration, stats.bannedUsers][i] || 0}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tạo vật phẩm</Text>
        <TextInput placeholder="Tên vật phẩm" style={styles.input} value={newItem.name} onChangeText={(t) => setNewItem({ ...newItem, name: t })} />
        <TextInput placeholder="Mô tả" style={styles.input} value={newItem.description} onChangeText={(t) => setNewItem({ ...newItem, description: t })} />
        <TextInput placeholder="Loại (AVATAR_FRAME...)" style={styles.input} value={newItem.type} onChangeText={(t) => setNewItem({ ...newItem, type: t })} />
        <TextInput placeholder="Giá (VNĐ)" style={styles.input} keyboardType="numeric" value={String(newItem.price)} onChangeText={(t) => setNewItem({ ...newItem, price: Number(t) || 0 })} />
        <Button onPress={pickImage}>Chọn ảnh</Button>
        {previewUri ? <Image source={{ uri: previewUri }} style={{ width: 100, height: 100, marginTop: 8 }} /> : null}
        <Button onPress={handleCreateItem} style={{ marginTop: 8 }}>Tạo vật phẩm</Button>

        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Danh sách vật phẩm</Text>
        {shopItems.map(item => (
          <View key={item._id} style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600' }}>{item.name}</Text>
              <Text>{item.type} • {item.price} VNĐ</Text>
            </View>
            {item.assetUrl ? <Image source={{ uri: item.assetUrl }} style={{ width: 50, height: 50 }} /> : null}
            <Button onPress={() => handleDeleteItem(item._id)} style={{ marginLeft: 8 }} variant="secondary">Xoá</Button>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tạo gói coin</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
          {[50,100,150,200,300,500].map(amount => {
            const id = `packed_${amount}_coin`;
            const exists = existingPackages.includes(id);
            return (
              <TouchableOpacity key={amount} onPress={() => setNewPackageCoins(amount)} style={[styles.coinButton, newPackageCoins === amount && styles.coinButtonActive, exists && styles.disabled]}>
                <Text>{amount} {exists ? '(Đã tồn tại)' : ''}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Button onPress={handleCreateCoinPackage} disabled={!newPackageCoins}>Tạo gói coin</Button>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tạo sở thích</Text>
        <TextInput placeholder="Tên sở thích" style={styles.input} value={newInterest} onChangeText={setNewInterest} />
        <Button onPress={handleCreateInterest}>Tạo sở thích</Button>

        <View style={{ marginTop: 12 }}>
          {interests.map(i => (
            <View key={i._id} style={styles.interestRow}>
              <Text>{i.name}</Text>
              <Button onPress={() => handleDeleteInterest(i._id)} variant="secondary">Xoá</Button>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Báo cáo người dùng</Text>
        {reports.map(r => (
          <View key={r._id} style={styles.reportCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '600' }}>{r.reporter?.username || 'Ẩn danh'}</Text>
              <Text>{new Date(r.createdAt).toLocaleString()}</Text>
            </View>
            <Text style={{ marginTop: 6 }}>{r.reason}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  grid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  statBox: { flex: 1, padding: 12, marginRight: 8, backgroundColor: '#f3f6ff', borderRadius: 8 },
  statLabel: { fontSize: 12, color: '#333' },
  statValue: { fontSize: 18, fontWeight: '700' },
  section: { marginTop: 12, paddingVertical: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 8, marginBottom: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  coinButton: { padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', marginRight: 8 },
  coinButtonActive: { backgroundColor: '#e6f0ff' },
  disabled: { opacity: 0.5 },
  interestRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  reportCard: { padding: 10, borderWidth: 1, borderColor: '#eee', borderRadius: 8, marginBottom: 8 },
});

export default AdminDashboardPage;
