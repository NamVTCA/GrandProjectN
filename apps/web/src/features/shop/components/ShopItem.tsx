import React from 'react';
import Button from '../../../components/common/Button';

export interface Item {
  _id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  assetUrl?: string;
}

interface ShopItemProps {
  item: Item;
}

const ShopItem: React.FC<ShopItemProps> = ({ item }) => {
  return (
    <div className="shop-item">
      <img src={item.assetUrl || 'https://via.placeholder.com/150'} alt={item.name} />
      <h4>{item.name}</h4>
      <p>{item.description}</p>
      <span className="price">{item.price.toLocaleString()} {item.currency}</span>
      <Button>Mua</Button>
    </div>
  );
};

export default ShopItem;
