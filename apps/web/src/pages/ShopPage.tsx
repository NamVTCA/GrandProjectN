// File: src/pages/ShopPage.tsx (Mới)
import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import type { ShopItem } from '../features/shop/types/Shop';
import ShopItemCard from '../features/shop/components/ShopItemCard';
import { useAuth } from '../features/auth/AuthContext';
import './ShopPage.scss';

const ShopPage: React.FC = () => {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, fetchUser } = useAuth(); // Lấy hàm fetchUser để cập nhật số dư

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/shop/items');
      setItems(response.data);
    } catch (error) {
      console.error("Lỗi khi tải vật phẩm cửa hàng:", error);
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
      alert(response.data.message);
      fetchUser(); // Cập nhật lại thông tin user để thấy số coin mới
    } catch (error: any) {
      alert(error.response?.data?.message || 'Giao dịch thất bại.');
    }
  };

  return (
    <div className="shop-page">
      <div className="shop-header">
        <h1>Cửa hàng Vật phẩm</h1>
        <div className="user-coins">
          <span>Số dư:</span>
          <strong>{user?.coins.toLocaleString() || 0} Coins</strong>
        </div>
      </div>
      {loading ? (
        <p className="page-status">Đang tải cửa hàng...</p>
      ) : (
        <div className="shop-grid">
          {items.map(item => (
            <ShopItemCard key={item._id} item={item} onPurchase={handlePurchase} />
          ))}
        </div>
      )}
    </div>
  );
};
export default ShopPage;