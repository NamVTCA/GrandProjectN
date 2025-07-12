import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ShopItem, ShopItemDocument } from './schemas/shop-item.schema';
import { UserDocument } from '../auth/schemas/user.schema';
import { PaymentsService } from '../payments/payments.service';
import { InventoryService } from '../inventory/inventory.service'; // Import InventoryService

@Injectable()
export class ShopService {
  constructor(
    @InjectModel(ShopItem.name) private shopItemModel: Model<ShopItemDocument>,
    private inventoryService: InventoryService, // <-- Bỏ PaymentsService, thêm InventoryService
  ) {}

  async listItems(): Promise<ShopItem[]> {
    return this.shopItemModel.find().exec();
  }

// --- VIẾT LẠI HOÀN TOÀN LOGIC MUA VẬT PHẨM ---
  async purchaseItem(user: UserDocument, itemId: string): Promise<{ message: string }> {
    const item = await this.shopItemModel.findById(itemId);
    if (!item) {
      throw new NotFoundException('Vật phẩm không tồn tại.');
    }

    // Kiểm tra xem người dùng có đủ tiền không
    if (user.coins < item.price) {
      throw new BadRequestException('Bạn không đủ coins để mua vật phẩm này.');
    }

    // Trừ tiền của người dùng
    user.coins -= item.price;
    await user.save();

    // Thêm vật phẩm vào kho đồ
    await this.inventoryService.addItemToInventory(user._id, item._id as string);

    return {
      message: `Mua thành công vật phẩm "${item.name}"!`,
    };
  }
}
