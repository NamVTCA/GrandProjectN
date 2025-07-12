// File: src/features/shop/components/ShopItemCard.tsx (Mới)
import React from 'react';
import type { ShopItem } from '../types/Shop';
import Button from '../../../components/common/Button';
import './ShopItemCard.scss';

interface ShopItemCardProps {
  item: ShopItem;
  onPurchase: (itemId: string) => void;
}

const ShopItemCard: React.FC<ShopItemCardProps> = ({ item, onPurchase }) => {
  return (
    <div className="shop-item-card">
      <div className="item-preview">
        <img src={item.assetUrl || 'https://via.placeholder.com/250'} alt={item.name} />
      </div>
      <div className="item-details">
        <h4>{item.name}</h4>
        <p>{item.description}</p>
        <div className="item-footer">
          <span className="price">{item.price.toLocaleString()} Coins</span>
          <Button onClick={() => onPurchase(item._id)}>Mua</Button>
        </div>
      </div>
    </div>
  );
};
export default ShopItemCard;