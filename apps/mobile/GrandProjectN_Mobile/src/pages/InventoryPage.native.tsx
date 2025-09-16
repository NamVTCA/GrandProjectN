import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, FlatList, Alert } from 'react-native';
import { Button } from 'react-native-paper';
import api from '../services/api';
import type { InventoryItem } from '../features/inventory/types/Inventory';
import { useAuth } from '../features/auth/AuthContext';

const STATIC_ORIGIN = 'http://localhost:8888'; // Adjust based on your environment
const PLACEHOLDER = 'https://via.placeholder.com/150';

const InventoryPage: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { fetchUser, user } = useAuth();

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/inventory/me');
      const safe = Array.isArray(response.data) ? response.data.filter((x: InventoryItem) => !!x.item) : [];
      setInventory(safe);
    } catch (error) {
      console.error("Lỗi khi tải kho đồ:", error);
      Alert.alert('Lỗi', 'Không thể tải kho đồ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleEquip = async (inventoryId: string) => {
    try {
      await api.post('/inventory/equip', { inventoryId });
    } catch (error) {
      console.error('Lỗi khi trang bị:', error);
    }
  };

  const handleUnequip = async (type: string) => {
    try {
      await api.post('/inventory/unequip', { type });
    } catch (error) {
      console.error('Lỗi khi gỡ trang bị:', error);
    }
  };

  const handleToggle = async (inv: InventoryItem) => {
    try {
      const isFrame = inv.item.type === 'AVATAR_FRAME';
      const isEquipped = isFrame && user?.equippedAvatarFrame?._id === (inv.item as any)._id;

      if (isEquipped) {
        await handleUnequip('AVATAR_FRAME');
      } else {
        await handleEquip(inv._id);
      }
      await Promise.all([fetchInventory(), fetchUser()]);
    } catch (error: any) {
      console.error('Toggle equip error:', error);
      Alert.alert('Lỗi', error?.response?.data?.message || 'Có lỗi khi thay đổi trang bị.');
    }
  };

  const renderItem = ({ item }: { item: InventoryItem }) => {
    const inventoryItem = item;
    const imgSrc = inventoryItem.item?.assetUrl 
      ? (inventoryItem.item.assetUrl.startsWith('http') 
          ? inventoryItem.item.assetUrl 
          : `${STATIC_ORIGIN}${inventoryItem.item.assetUrl}`)
      : PLACEHOLDER;

    const isFrame = inventoryItem.item?.type === 'AVATAR_FRAME';
    const isEquipped = isFrame && user?.equippedAvatarFrame?._id === (inventoryItem.item as any)._id;

    return (
      <View style={styles.itemCard}>
        <Image
          source={{ uri: imgSrc }}
          style={styles.itemImage}
          defaultSource={{ uri: PLACEHOLDER }}
        />
        <Text style={styles.itemName}>{inventoryItem.item?.name}</Text>
        <Button
          mode={isEquipped ? "outlined" : "contained"}
          onPress={() => handleToggle(inventoryItem)}
          style={styles.button}
        >
          {isEquipped ? 'Gỡ trang bị' : 'Trang bị'}
        </Button>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Đang tải kho đồ...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kho đồ của bạn</Text>
      {inventory.length > 0 ? (
        <FlatList
          data={inventory}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Kho đồ của bạn trống.</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  itemCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    width: '100%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default InventoryPage;