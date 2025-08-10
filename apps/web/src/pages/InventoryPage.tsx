import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import type { InventoryItem } from '../features/inventory/types/Inventory';
import { useAuth } from '../features/auth/AuthContext';
import Button from '../components/common/Button';
import './InventoryPage.scss';

const STATIC_ORIGIN = import.meta.env.VITE_API_STATIC_URL || 'http://localhost:8888';
const toAssetUrl = (u?: string) => (!u ? '' : u.startsWith('http') ? u : `${STATIC_ORIGIN}${u}`);
const PLACEHOLDER = 'https://via.placeholder.com/150';

const InventoryPage: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { fetchUser, user } = useAuth(); // để biết đang trang bị gì

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/inventory/me');
      const safe = Array.isArray(response.data) ? response.data.filter((x: InventoryItem) => !!x.item) : [];
      setInventory(safe);
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
    await api.post('/inventory/equip', { inventoryId });
  };

  const handleUnequip = async (type: string) => {
    await api.post('/inventory/unequip', { type }); // backend nhận ItemType
  };

  // Toggle: nếu item đang trang bị -> gỡ; nếu chưa -> trang bị
  const handleToggle = async (inv: InventoryItem) => {
    try {
      const isFrame = inv.item.type === 'AVATAR_FRAME';
      const isEquipped =
        isFrame && user?.equippedAvatarFrame?._id === (inv.item as any)._id;

      if (isEquipped) {
        await handleUnequip('AVATAR_FRAME');
        await Promise.all([fetchInventory(), fetchUser()]);
      } else {
        await handleEquip(inv._id);
        await Promise.all([fetchInventory(), fetchUser()]);
      }
    } catch (error: any) {
      console.error('Toggle equip error:', error?.response?.data || error);
      alert(error?.response?.data?.message || 'Có lỗi khi thay đổi trang bị.');
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
            inventory.map((inv) => {
              const item = inv.item!;
              const imgSrc = item.assetUrl ? toAssetUrl(item.assetUrl) : PLACEHOLDER;
              const isFrame = item.type === 'AVATAR_FRAME';
              const isEquipped = isFrame && user?.equippedAvatarFrame?._id === (item as any)._id;

              return (
                <div key={inv._id} className="inventory-item-card">
                  <div className="item-preview">
                    <img
                      src={imgSrc}
                      alt={item.name}
                      onError={(e) => ((e.currentTarget as HTMLImageElement).src = PLACEHOLDER)}
                    />
                  </div>
                  <h4>{item.name}</h4>

                  <Button
                    onClick={() => handleToggle(inv)}
                    variant={isEquipped ? 'secondary' : 'primary'}
                  >
                    {isEquipped ? 'Gỡ trang bị' : 'Trang bị'}
                  </Button>
                </div>
              );
            })
          ) : (
            <p className="page-status">Kho đồ của bạn trống.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
