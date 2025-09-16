import type { ShopItem } from '../../shop/types/Shop';

export interface InventoryItem {
  _id: string; // ID của bản ghi trong kho đồ, không phải ID vật phẩm
  user: string;
  item: ShopItem; // Populate thông tin chi tiết của vật phẩm
  createdAt: string;
}