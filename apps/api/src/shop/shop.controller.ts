import { Controller, Get, Post, UseGuards, Body } from '@nestjs/common';
import { ShopService } from './shop.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserDocument } from '../auth/schemas/user.schema';
import { PurchaseItemDto } from './dto/purchase-item.dto';

@UseGuards(JwtAuthGuard)
@Controller('shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get('items')
  listItems() {
    return this.shopService.listItems();
  }

  @Post('purchase')
  purchaseItem(@GetUser() user: UserDocument, @Body() purchaseItemDto: PurchaseItemDto) {
    return this.shopService.purchaseItem(user, purchaseItemDto.itemId);
  }
}