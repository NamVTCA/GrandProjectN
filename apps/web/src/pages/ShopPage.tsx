import React, { useEffect, useState } from 'react';
import api from '../services/api';
import ShopItem from '../features/shop/components/ShopItem';
import type { Item } from '../features/shop/components/ShopItem';
import './ShopPage.scss'; // Import your styles here

const ShopPage: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]); // Cần định nghĩa kiểu Item sau

  useEffect(() => {
    api.get('/shop/items').then(res => setItems(res.data));
  }, []);

return (
    <div className="shop-page">
      <h1>Cửa hàng Vật phẩm</h1>
      <div className="shop-grid">
        {items.map(item => <ShopItem key={item._id} item={item} />)}
      </div>
    </div>
  );
};

export default ShopPage;