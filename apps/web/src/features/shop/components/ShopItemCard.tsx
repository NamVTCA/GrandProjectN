import React from 'react';
import type { ShopItem } from '../types/Shop';
import Button from '../../../components/common/Button';
import './ShopItemCard.scss';

interface ShopItemCardProps {
  item: ShopItem;
  owned?: boolean;                 // đã mua hay chưa
  onPurchase: (itemId: string) => void;
  disabled?: boolean;              // không đủ coin, đang load, v.v.
}

const PLACEHOLDER = 'https://via.placeholder.com/250';

const ShopItemCard: React.FC<ShopItemCardProps> = ({
  item, owned = false, onPurchase, disabled
}) => {
  // Lấy domain static từ ENV (ví dụ: http://localhost:8888)
  const staticUrl = import.meta.env.VITE_API_STATIC_URL || '';

  // Chuẩn hóa URL ảnh: nếu assetUrl là path tương đối (/uploads/..)
  // thì prefix bằng staticUrl; nếu là URL tuyệt đối thì dùng luôn.
  const imgSrc =
    item.assetUrl
      ? (item.assetUrl.startsWith('http')
          ? item.assetUrl
          : `${staticUrl}${item.assetUrl}`)
      : PLACEHOLDER;

  return (
    <div className="shop-item-card">
      <div className="item-preview">
        <img
          className="plain-asset"
          src={imgSrc}
          alt={item.name}
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER; }}
        />
      </div>

      <div className="item-details">
        <h4>{item.name}</h4>
        <p>{item.description}</p>

        <div className="item-footer">
          <span className="price">{item.price.toLocaleString()} Coins</span>

          {owned ? (
            <Button disabled variant="secondary">Đã mua</Button>
          ) : (
            <Button disabled={disabled} onClick={() => onPurchase(item._id)}>
              Mua
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopItemCard;
