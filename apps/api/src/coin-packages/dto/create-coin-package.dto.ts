import { IsString, IsNumber, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCoinPackageDto {
  @IsString()
  @IsNotEmpty()
  packageId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  coinsAmount: number;

  @IsNumber()
  price: number;

  @IsString()
  @IsOptional()
  currency?: string;
}
