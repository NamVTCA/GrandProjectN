import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserDocument } from '../auth/schemas/user.schema';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // --- ENDPOINT MỚI ĐỂ TẠO YÊU CẦU THANH TOÁN ---
  @UseGuards(JwtAuthGuard)
  @Post('create-payment-intent')
  createPaymentIntent(
    @GetUser() user: UserDocument,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    return this.paymentsService.createPaymentIntent(user, createPaymentDto.packageId);
  }

  // Endpoint này mô phỏng webhook được gọi bởi cổng thanh toán khi giao dịch thành công.
  // Trong thực tế, nó cần được bảo vệ bằng secret key hoặc chữ ký từ webhook.
  @Post('webhook/success')
  handleSuccessfulPayment(@Body('orderId') orderId: string) {
    return this.paymentsService.fulfillOrder(orderId);
  }
}