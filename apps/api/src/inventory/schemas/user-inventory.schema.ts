import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { User } from '../../auth/schemas/user.schema';
import { ShopItem } from '../../shop/schemas/shop-item.schema';

@Schema({ timestamps: true })
export class UserInventory {
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'User' }) user: User;
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'ShopItem' }) item: ShopItem;
}
export const UserInventorySchema = SchemaFactory.createForClass(UserInventory);
export type UserInventoryDocument = UserInventory & Document;