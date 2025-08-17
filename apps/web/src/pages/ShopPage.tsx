import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import type { ShopItem } from '../features/shop/types/Shop';
import ShopItemCard from '../features/shop/components/ShopItemCard';
import { useAuth } from '../features/auth/AuthContext';
import './ShopPage.scss';
import { useNavigate } from 'react-router-dom';
import { Coins } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ShopPage: React.FC = () => {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, fetchUser } = useAuth();
  const navigate = useNavigate();

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/shop/items');
      setItems(response.data);
    } catch (error) {
      toast.error("Lỗi khi tải vật phẩm cửa hàng");
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
      toast.success(response.data.message);
      fetchUser();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Giao dịch thất bại');
    }
  };

  return (
    <div className="shop-page">
      <div className="shop-header">
        <h1>Cửa hàng Vật phẩm</h1>
        <div className="user-coins">
          <span>Số dư:</span>
          <strong>
            {user?.coins.toLocaleString() || 0} <Coins size={16} />
          </strong>
          <button
            className="topup-button"
            onClick={() => navigate('/top-up')}
          >
            + Nạp Coin
          </button>
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