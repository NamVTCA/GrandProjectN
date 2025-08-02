import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CoinPackagesService } from './coin-packages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CoinPackage,
  CoinPackageDocument,
} from 'src/payments/schemas/coin-package.schema';

@Controller('coin-packages')
export class CoinPackagesController {
  constructor(private readonly coinPackagesService: CoinPackagesService) {}

  @UseGuards(JwtAuthGuard) // Bất kỳ ai đăng nhập cũng có thể xem
  @Get()
  findAll() {
    return this.coinPackagesService.findAll();
  }
  @Post()
  async create(@Body() dto: CoinPackageDocument): Promise<CoinPackage> {
    return this.coinPackagesService.createCoinPackage(dto);
  }
  @UseGuards(JwtAuthGuard)
  @Get(':packageId')
  async getById(@Param('packageId') packageId: string): Promise<CoinPackage> {
    const coinPack = await this.coinPackagesService.findOne(packageId);
    if (!coinPack) {
      throw new NotFoundException('Không tìm thấy gói coin');
    }
    return coinPack;
  }
}
