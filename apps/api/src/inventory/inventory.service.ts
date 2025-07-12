import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserInventory, UserInventoryDocument } from './schemas/user-inventory.schema';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { ItemType, ShopItemDocument } from '../shop/schemas/shop-item.schema';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(UserInventory.name) private inventoryModel: Model<UserInventoryDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async addItemToInventory(userId: string | Types.ObjectId, itemId: string | Types.ObjectId): Promise<UserInventory> {
    const newItem = new this.inventoryModel({ user: userId, item: itemId });
    return newItem.save();
  }

  async getUserInventory(userId: string): Promise<UserInventory[]> {
    return this.inventoryModel.find({ user: userId }).populate('item').exec();
  }

async equipItem(user: UserDocument | null, inventoryId: string): Promise<UserDocument> {
  if (!user) {
    throw new NotFoundException('Người dùng không tồn tại.');
  }

  const inventoryItem = await this.inventoryModel.findById(inventoryId).populate('item');

  if (!inventoryItem || inventoryItem.user.toString() !== user._id.toString()) {
    throw new NotFoundException('Không tìm thấy vật phẩm trong kho đồ của bạn.');
  }

  const item = inventoryItem.item as ShopItemDocument;
  let updateQuery = {};

  if (item.type === ItemType.AVATAR_FRAME) {
    updateQuery = { equippedAvatarFrame: item._id };
  } else if (item.type === ItemType.PROFILE_BACKGROUND) {
    updateQuery = { equippedProfileBackground: item._id };
  } else {
    throw new BadRequestException('Không thể trang bị loại vật phẩm này.');
  }

  const updatedUser = await this.userModel.findByIdAndUpdate(user._id, { $set: updateQuery }, { new: true }).exec();
  if (!updatedUser) {
    throw new NotFoundException('Không tìm thấy người dùng sau khi cập nhật.');
  }
  return updatedUser;
}
}
