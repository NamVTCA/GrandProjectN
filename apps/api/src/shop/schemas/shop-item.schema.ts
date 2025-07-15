import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum ItemType {
  AVATAR_FRAME = 'AVATAR_FRAME',           // Khung ảnh đại diện (có thể là ảnh tĩnh hoặc động)
  PROFILE_BACKGROUND = 'PROFILE_BACKGROUND', // Nền hồ sơ (ảnh tĩnh hoặc động)
  PROFILE_EFFECT = 'PROFILE_EFFECT',         // Hiệu ứng đặc biệt trên hồ sơ (ví dụ: tuyết rơi)
  AVATAR_DECORATION = 'AVATAR_DECORATION', // Trang trí nhỏ trên avatar (ví dụ: huy hiệu)
  NAMEPLATE_THEME = 'NAMEPLATE_THEME',       // Theme cho bảng tên (thay đổi màu sắc, font, nền)
}

@Schema({ timestamps: true })
export class ShopItem {
  @Prop({ required: true, trim: true }) name: string;
  @Prop({ required: true }) description: string;
  @Prop({ required: true, enum: ItemType }) type: ItemType;
  // --- THAY ĐỔI LOGIC GIÁ ---
  @Prop({ required: true })
  price: number; // Giá bây giờ là số Coins
  // assetUrl sẽ lưu đường dẫn đến file ảnh/video động (GIF, WEBM, Lottie JSON)
  @Prop() assetUrl?: string;
}
export const ShopItemSchema = SchemaFactory.createForClass(ShopItem);
export type ShopItemDocument = ShopItem & Document;
