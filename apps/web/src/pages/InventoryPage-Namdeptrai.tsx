import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useToast } from '../components/common/Toast/ToastContext';
import Button from '../components/common/Button';
import { useAuth } from '../features/auth/AuthContext';

interface InventoryItem {
  _id: string;
  item: { _id: string; name: string; assetUrl?: string; };
}

const InventoryPage: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const { addToast } = useToast();
  const { fetchUser } = useAuth(); // Lấy hàm để cập nhật lại thông tin user

  const fetchInventory = () => {
    api.get('/inventory/me').then(res => setInventory(res.data));
  };

  useEffect(fetchInventory, []);

  const handleEquip = async (inventoryId: string) => {
    try {
      await api.post('/inventory/equip', { inventoryId });
      addToast('Trang bị thành công!', 'success');
      fetchUser(); // Cập nhật lại thông tin user để hiển thị vật phẩm đã trang bị
    } catch (error) {
      addToast('Trang bị thất bại.', 'error');
    }
  };

  return (
    <div className="inventory-page">
      <h1>Kho đồ của bạn</h1>
      <div className="inventory-grid">
        {inventory.map(invItem => (
          <div key={invItem._id} className="inventory-item">
            <p>{invItem.item.name}</p>
            <Button onClick={() => handleEquip(invItem._id)}>Trang bị</Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InventoryPage;