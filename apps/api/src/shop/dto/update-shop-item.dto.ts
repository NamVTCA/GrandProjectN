import { IsOptional, IsString, IsNumber, Min, IsEnum, IsUrl } from 'class-validator';
import { ItemType } from '../schemas/shop-item.schema';

export class UpdateShopItemDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ItemType)
  type?: ItemType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsUrl()
  assetUrl?: string;
}