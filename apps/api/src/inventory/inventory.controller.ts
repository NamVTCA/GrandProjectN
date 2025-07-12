import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserDocument } from '../auth/schemas/user.schema';
import { EquipItemDto } from './dto/equip-item.dto';

@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('me')
  getMyInventory(@GetUser() user: UserDocument) {
    return this.inventoryService.getUserInventory(user._id.toString());
  }

  @Post('equip')
  equipItem(@GetUser() user: UserDocument, @Body() equipItemDto: EquipItemDto) {
    return this.inventoryService.equipItem(user, equipItemDto.inventoryId);
  }
}
