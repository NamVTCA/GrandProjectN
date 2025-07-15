import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { ChatModule } from './chat/chat.module';
import { NotificationsModule } from './notifications/notifications.module';
import { GroupsModule } from './groups/groups.module';
import { InterestsModule } from './interests/interests.module';
import { WebRTCModule } from './webrtc/webrtc.module';
import { RewardsModule } from './rewards/rewards.module';
import { ShopModule } from './shop/shop.module';
import { InventoryModule } from './inventory/inventory.module';
import { PaymentsModule } from './payments/payments.module';
import { GameActivityModule } from './game-activity/game-activity.module';
import { ModerationModule } from './moderation/moderation.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MediaProcessingModule } from './media-processing/media-processing.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FriendsModule } from './friends/friends.module';
import { ReportsModule } from './reports/reports.module';
import { AdminModule } from './admin/admin.module';
import { StoriesModule } from './stories/stories.module';
import { LivestreamModule } from './livestream/livestream.module';
import { PresenceModule } from './presence/presence.module';
import { SettingsModule } from './settings/settings.module'; // <-- IMPORT MODULE MỚI
import { CoinPackagesModule } from './coin-packages/coin-packages.module'; // <-- IMPORT MODULE MỚI
import { SearchModule } from './search/search.module';

@Module({
  imports: [
        MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get('MAIL_HOST'),
          secure: true,
          auth: {
            user: config.get('MAIL_USER'),
            pass: config.get('MAIL_PASS'),
          },
        },
        defaults: {
          from: config.get('MAIL_FROM'),
        },
      }),
    }),
    EventEmitterModule.forRoot(), // Thêm dòng này ở đầu
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(process.env.MONGO_URI ?? (() => { throw new Error('MONGO_URI is not defined'); })()),
    AuthModule,
    UsersModule,
    PostsModule,
    ChatModule,
    NotificationsModule,
    GroupsModule,
    InterestsModule,
    WebRTCModule,
    RewardsModule,
    ShopModule,
    InventoryModule,
    PaymentsModule,
    GameActivityModule,
    ModerationModule,
    MediaProcessingModule,
    ChatbotModule,
    FriendsModule,
    ReportsModule,
    AdminModule,
    StoriesModule,
    LivestreamModule,
    PresenceModule,
    SettingsModule, // <-- THÊM VÀO DANH SÁCH IMPORTS 
    CoinPackagesModule, // <-- THÊM VÀO DANH SÁCH IMPORTS
    SearchModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}