import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
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
}
