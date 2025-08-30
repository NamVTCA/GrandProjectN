import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Headers,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserDocument } from '../auth/schemas/user.schema';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create-payment-intent')
  createPaymentIntent(
    @GetUser() user: UserDocument,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    return this.paymentsService.createPaymentIntent(
      user,
      createPaymentDto.packageId,
    );
  }

  @Post('webhook')
  handleWebhook(
    @Req() req: any,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhookEvent(req.rawBody, signature);
  }
}
