import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import api from '../services/api';
import type { ShopItem } from '../features/shop/types/Shop';
import { useAuth } from '../features/auth/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Coins } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import ShopItemCard from '../features/shop/components/ShopItemCard.native';

const ShopPage: React.FC = () => {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, fetchUser } = useAuth();
  const navigation = useNavigation();

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/shop/items');
      setItems(response.data);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi khi tải vật phẩm cửa hàng',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handlePurchase = async (itemId: string) => {
    try {
      const response = await api.post('/shop/purchase', { itemId });
      Toast.show({
        type: 'success',
        text1: response.data.message,
      });
      fetchUser();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: error.response?.data?.message || 'Giao dịch thất bại',
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.shopHeader}>
        <Text style={styles.title}>Cửa hàng Vật phẩm</Text>
        <View style={styles.userCoins}>
          <Text style={styles.coinText}>Số dư:</Text>
          <Text style={styles.coinAmount}>
            {user?.coins.toLocaleString() || 0} <Coins size={16} color="#c1cd78" />
          </Text>
          <TouchableOpacity
            style={styles.topupButton}
            onPress={() => navigation.navigate('TopUp' as never)}
          >
            <Text style={styles.topupText}>+ Nạp Coin</Text>
          </TouchableOpacity>
        </View>
      </View>
      {loading ? (
        <Text style={styles.statusText}>Đang tải cửa hàng...</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.shopGrid}>
          {items.map(item => (
            <ShopItemCard key={item._id} item={item} onPurchase={handlePurchase} />
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#0e4420',
  },
  shopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#c1cd78',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#c1cd78',
  },
  userCoins: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#083b38',
    padding: 8,
    borderRadius: 8,
  },
  coinText: {
    color: '#d5e4c3',
    marginRight: 8,
  },
  coinAmount: {
    color: '#c1cd78',
    fontWeight: '700',
  },
  topupButton: {
    marginLeft: 16,
    backgroundColor: '#c1cd78',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  topupText: {
    color: '#0e4420',
  },
  statusText: {
    textAlign: 'center',
    color: '#d5e4c3',
    marginTop: 20,
  },
  shopGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});

export default ShopPage;