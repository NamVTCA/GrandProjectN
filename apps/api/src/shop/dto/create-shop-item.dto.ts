// File: apps/api/src/shop/dto/create-shop-item.dto.ts (Mới)
import { IsNotEmpty, IsString, IsNumber, Min, IsEnum, IsOptional, IsUrl } from 'class-validator';
import { ItemType } from '../schemas/shop-item.schema';

export class CreateShopItemDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsEnum(ItemType)
  type: ItemType;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsUrl()
  assetUrl?: string;
}
