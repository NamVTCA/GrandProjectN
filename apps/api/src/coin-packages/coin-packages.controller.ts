import { Controller, Get, UseGuards } from '@nestjs/common';
import { CoinPackagesService } from './coin-packages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('coin-packages')
export class CoinPackagesController {
  constructor(private readonly coinPackagesService: CoinPackagesService) {}

  @UseGuards(JwtAuthGuard) // Bất kỳ ai đăng nhập cũng có thể xem
  @Get()
  findAll() {
    return this.coinPackagesService.findAll();
  }
}