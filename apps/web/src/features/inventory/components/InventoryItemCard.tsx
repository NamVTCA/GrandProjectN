import React from 'react';
import Button from '../../../components/common/Button';
import './InventoryItemCard.scss';
import type { ShopItem } from '../../shop/types/Shop';

interface InventoryItemCardProps {
  item: ShopItem;
  equipped?: boolean;               // đang trang bị?
  userAvatarUrl?: string;           // để preview
  onEquip: (itemId: string) => void;
  onUnequip: (itemId: string) => void;
}

const PLACEHOLDER = 'https://via.placeholder.com/250';
const STATIC_ORIGIN = 'http://localhost:8888'; // <- ghép domain API (đảm bảo ảnh hiện)

const InventoryItemCard: React.FC<InventoryItemCardProps> = ({
  item,
  equipped = false,
  userAvatarUrl = '/images/avatar-placeholder.png',
  onEquip,
  onUnequip,
}) => {
  const isFrame = item.type === 'AVATAR_FRAME';

  // Nếu assetUrl là /uploads/..., ghép thêm domain; nếu trống thì dùng placeholder
  const toSrc = (u?: string) =>
    !u ? PLACEHOLDER : (u.startsWith('http') ? u : `${STATIC_ORIGIN}${u}`);

  const assetSrc = toSrc(item?.assetUrl);

  return (
    <div className={`inventory-item-card ${equipped ? 'equipped' : ''}`}>
      <div className="item-preview">
        {isFrame ? (
          <div className="avatar-with-frame" aria-label={`Xem trước ${item.name}`}>
            <img className="avatar" src={userAvatarUrl} alt="Avatar" />
            <img
              className="frame"
              src={assetSrc}
              alt={item.name}
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER; }}
            />
          </div>
        ) : (
          <div className="profile-preview">
            <img
              className="bg"
              src={assetSrc}
              alt={item.name}
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER; }}
            />
            <div className="profile-overlay">
              <img className="mini-avatar" src={userAvatarUrl} alt="Avatar" />
              <div className="line" /><div className="line short" />
            </div>
          </div>
        )}
      </div>

      <div className="item-details">
        <h4>{item.name}</h4>
        <p>{item.description}</p>

        <div className="item-footer">
          {equipped ? (
            <Button variant="secondary" onClick={() => onUnequip(item._id)}>
              Bỏ trang bị
            </Button>
          ) : (
            <Button onClick={() => onEquip(item._id)}>
              Trang bị
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryItemCard;
