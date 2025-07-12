// File: src/features/shop/types/Shop.ts (Mới)
export interface ShopItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  assetUrl?: string;
  type: 'AVATAR_FRAME' | 'PROFILE_BACKGROUND';
}