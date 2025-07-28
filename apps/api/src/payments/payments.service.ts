import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from './schemas/order.schema';
import { UserDocument } from '../auth/schemas/user.schema';
import {
  CoinPackage,
  CoinPackageDocument,
} from './schemas/coin-package.schema';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel('User') private readonly userModel: Model<UserDocument>,
    @InjectModel(CoinPackage.name)
    private coinPackageModel: Model<CoinPackageDocument>,
    private configService: ConfigService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined in configuration');
    }
    // SỬA LỖI 1: Ép kiểu apiVersion để bỏ qua lỗi không tương thích của @types/stripe
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20' as any,
    });
  }

  async createPaymentIntent(
    user: UserDocument,
    packageId: string,
  ): Promise<{ orderId: string; clientSecret: string }> {
    const coinPackage = await this.coinPackageModel.findOne({ packageId });
    if (!coinPackage) {
      throw new NotFoundException('Gói nạp không tồn tại.');
    }

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: coinPackage.price,
      currency: coinPackage.currency.toLowerCase(),
      metadata: {
        userId: user.id,
        packageId: coinPackage.packageId,
      },
    });

    // SỬA LỖI 2: Kiểm tra xem client_secret có tồn tại không
    if (!paymentIntent.client_secret) {
      throw new InternalServerErrorException(
        'Không thể tạo yêu cầu thanh toán từ Stripe.',
      );
    }

    const newOrder = new this.orderModel({
      user: user._id,
      coinPackage: coinPackage._id,
      amount: coinPackage.price,
      status: OrderStatus.PENDING,
      paymentIntentId: paymentIntent.id,
    });

    const savedOrder = await newOrder.save();

    return {
      orderId: savedOrder.id,
      clientSecret: paymentIntent.client_secret, // Bây giờ client_secret chắc chắn là một chuỗi string
    };
  }

  async fulfillOrder(orderId: string): Promise<{ message: string }> {
    const order = await this.orderModel
      .findById(orderId)
      .populate('coinPackage');
    if (!order || order.status !== OrderStatus.PENDING) {
      throw new NotFoundException('Đơn hàng không hợp lệ hoặc đã được xử lý.');
    }

    const coinPackage = order.coinPackage as CoinPackageDocument;

    const updatedUser = await this.userModel.findByIdAndUpdate(
      order.user,
      { $inc: { coins: coinPackage.coinsAmount } },
      { new: true },
    );

    if (!updatedUser) {
      throw new InternalServerErrorException(
        'Không thể cập nhật số dư của người dùng.',
      );
    }

    order.status = OrderStatus.COMPLETED;
    await order.save();

    return { message: `Nạp thành công ${coinPackage.coinsAmount} coins!` };
  }
  async createCoinPackage(dto: CoinPackageDocument): Promise<CoinPackage> {
    const newPackage = new this.coinPackageModel(dto);
    return await newPackage.save();
  }
}
