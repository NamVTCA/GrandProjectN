import { Controller, Get, Post, UseGuards, Body, HttpCode } from '@nestjs/common';
import { ShopService } from './shop.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserDocument } from '../auth/schemas/user.schema';
import { PurchaseItemDto } from './dto/purchase-item.dto';
import { ItemType } from './schemas/shop-item.schema';

@Controller('shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get('items')
  async listItems() {
    return this.shopService.listItems([
      ItemType.AVATAR_FRAME,
      ItemType.PROFILE_BACKGROUND,
    ]);
  }

  @UseGuards(JwtAuthGuard)
  @Post('purchase')
  @HttpCode(200)
  async purchaseItem(
    @GetUser() user: UserDocument,
    @Body() purchaseItemDto: PurchaseItemDto,
  ) {
    return this.shopService.purchaseItem(user, purchaseItemDto.itemId);
  }
}
