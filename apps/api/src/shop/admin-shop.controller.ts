import { Controller, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ShopService } from './shop.service';
import { CreateShopItemDto } from './dto/create-shop-item.dto';
import { UpdateShopItemDto } from './dto/update-shop-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GlobalRole } from '../auth/schemas/user.schema';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(GlobalRole.ADMIN)
@Controller('admin/shop')
export class AdminShopController {
  constructor(private readonly shopService: ShopService) {}

  @Post('items')
  createItem(@Body() createShopItemDto: CreateShopItemDto) {
    return this.shopService.createItem(createShopItemDto);
  }

  @Patch('items/:id')
  updateItem(@Param('id') id: string, @Body() updateShopItemDto: UpdateShopItemDto) {
    return this.shopService.updateItem(id, updateShopItemDto);
  }

  @Delete('items/:id')
  deleteItem(@Param('id') id: string) {
    return this.shopService.deleteItem(id);
  }
}
