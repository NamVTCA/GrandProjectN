import { IsNotEmpty, IsString } from 'class-validator';

export class PurchaseItemDto {
  @IsNotEmpty()
  @IsString()
  itemId: string;
}
