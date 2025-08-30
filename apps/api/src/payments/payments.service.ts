import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20' as any, // Use 'as any' to bypass type checking
    });
  }

  async createPaymentIntent(
    user: UserDocument,
    packageId: string,
  ): Promise<{ orderId: string; clientSecret: string }> {
    const coinPackage = await this.coinPackageModel.findOne({ packageId });
    if (!coinPackage) {
      throw new NotFoundException('Coin package not found.');
    }

    // Convert price to cents (Stripe expects amounts in smallest currency unit)
    const amountInCents = Math.round(coinPackage.price * 100);

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency: coinPackage.currency.toLowerCase(),
        metadata: {
          userId: user._id.toString(),
          packageId: coinPackage.packageId,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      if (!paymentIntent.client_secret) {
        throw new InternalServerErrorException(
          'Failed to create payment intent.',
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
        orderId: (savedOrder._id as Types.ObjectId).toString(),
        clientSecret: paymentIntent.client_secret,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to create payment intent: ${error.message}`,
      );
    }
  }

  async handleWebhookEvent(payload: Buffer, signature: string) {
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );

    if (!webhookSecret) {
      throw new InternalServerErrorException('Webhook secret not configured');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );
    } catch (err) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await this.fulfillOrder(paymentIntent.id);
    }

    return { received: true };
  }

  async fulfillOrder(paymentIntentId: string): Promise<{ message: string }> {
    const order = await this.orderModel
      .findOne({ paymentIntentId })
      .populate('coinPackage');

    if (!order || order.status !== OrderStatus.PENDING) {
      throw new NotFoundException('Invalid order or already processed.');
    }

    const coinPackage = order.coinPackage as CoinPackageDocument;

    const updatedUser = await this.userModel.findByIdAndUpdate(
      order.user,
      { $inc: { coins: coinPackage.coinsAmount } },
      { new: true },
    );

    if (!updatedUser) {
      throw new InternalServerErrorException('Failed to update user balance.');
    }

    order.status = OrderStatus.COMPLETED;
    await order.save();

    return { message: `Successfully added ${coinPackage.coinsAmount} coins!` };
  }

  async createCoinPackage(dto: CoinPackageDocument): Promise<CoinPackage> {
    const newPackage = new this.coinPackageModel(dto);
    return await newPackage.save();
  }
}
