import { Injectable, BadRequestException, NotFoundException,UnauthorizedException } from '@nestjs/common';
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

// --- NÂNG CẤP LOGIC TRANG BỊ ---
  async equipItem(user: UserDocument, inventoryId: string): Promise<UserDocument> {
    const inventoryEntry = await this.inventoryModel.findById(inventoryId).populate('item');
    if (!inventoryEntry || inventoryEntry.user.toString() !== user._id.toString()) {
      throw new NotFoundException('Không tìm thấy vật phẩm trong kho đồ của bạn.');
    }

    const itemToEquip = inventoryEntry.item as ShopItemDocument;
    let fieldToUpdate: string;

    // Xác định trường cần cập nhật trong UserSchema dựa trên loại vật phẩm
    switch (itemToEquip.type) {
      case ItemType.AVATAR_FRAME:
        fieldToUpdate = 'equippedAvatarFrame';
        break;
      case ItemType.PROFILE_BACKGROUND:
        fieldToUpdate = 'equippedProfileBackground';
        break;
      case ItemType.PROFILE_EFFECT:
        fieldToUpdate = 'equippedProfileEffect';
        break;
      case ItemType.AVATAR_DECORATION:
        fieldToUpdate = 'equippedAvatarDecoration';
        break;
      case ItemType.NAMEPLATE_THEME:
        fieldToUpdate = 'equippedNameplateTheme';
        break;
      default:
        throw new UnauthorizedException('Loại vật phẩm này không thể trang bị.');
    }

// Cập nhật User document, $set sẽ ghi đè lên giá trị cũ
    const updatedUser = await this.userModel.findByIdAndUpdate(
      user._id,
      { [fieldToUpdate]: itemToEquip._id },
      { new: true },
    );

    if (!updatedUser) {
      throw new NotFoundException('Không tìm thấy người dùng.');
    }

    return updatedUser;
  }
}
