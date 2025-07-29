import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ShopService } from './shop.service';
import { CreateShopItemDto } from './dto/create-shop-item.dto';
import { UpdateShopItemDto } from './dto/update-shop-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GlobalRole } from '../auth/schemas/user.schema';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';

import path from 'path';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(GlobalRole.ADMIN)
@Controller('admin/shop')
export class AdminShopController {
  constructor(private readonly shopService: ShopService) {}

  @Post('items')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/shop-items',
        filename: (req, file, cb) => {
          const ext = path.extname(file.originalname);
          const fileName = `${uuidv4()}${ext}`;
          cb(null, fileName);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new Error('Chỉ chấp nhận file ảnh'), false);
        }
        cb(null, true);
      },
    }),
  )
  async createItem(
    @Body() dto: CreateShopItemDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      dto.assetUrl = `/uploads/shop-items/${file.filename}`;
    }
    return this.shopService.createItem(dto);
  }

  @Patch('items/:id')
  updateItem(
    @Param('id') id: string,
    @Body() updateShopItemDto: UpdateShopItemDto,
  ) {
    return this.shopService.updateItem(id, updateShopItemDto);
  }

  @Delete('items/:id')
  deleteItem(@Param('id') id: string) {
    return this.shopService.deleteItem(id);
  }
}
