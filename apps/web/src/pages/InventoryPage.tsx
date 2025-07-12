// File: src/pages/InventoryPage.tsx (Mới)
import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import type { InventoryItem } from '../features/inventory/types/Inventory';
import { useAuth } from '../features/auth/AuthContext';
import Button from '../components/common/Button';
import './InventoryPage.scss';

const InventoryPage: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { fetchUser } = useAuth(); // Lấy hàm để cập nhật lại thông tin user

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/inventory/me');
      setInventory(response.data);
    } catch (error) {
      console.error("Lỗi khi tải kho đồ:", error);
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
      alert('Trang bị thành công!');
      fetchUser(); // Cập nhật lại thông tin user để hiển thị vật phẩm đã trang bị
    } catch (error) {
      alert('Trang bị thất bại.');
    }
  };

  return (
    <div className="inventory-page">
      <h1>Kho đồ của bạn</h1>
      {loading ? (
        <p className="page-status">Đang tải kho đồ...</p>
      ) : (
        <div className="inventory-grid">
          {inventory.length > 0 ? (
            inventory.map(invItem => (
              <div key={invItem._id} className="inventory-item-card">
                <img src={invItem.item.assetUrl || '[https://via.placeholder.com/150](https://via.placeholder.com/150)'} alt={invItem.item.name} />
                <h4>{invItem.item.name}</h4>
                <Button onClick={() => handleEquip(invItem._id)}>Trang bị</Button>
              </div>
            ))
          ) : (
            <p className="page-status">Kho đồ của bạn trống.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default InventoryPage;