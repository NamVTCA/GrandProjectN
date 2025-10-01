// ❌ Sai: import { Module, Post } from '@nestjs/common';
// ⬇️ Đúng:
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { Warning, WarningSchema  } from '../users/schemas/warning.schema';
// ⬇️ Import Post CLASS & Schema từ file schema của bạn (không phải Nest common)
import { Post, PostSchema } from '../posts/schemas/post.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Post.name, schema: PostSchema }, // đăng ký PostModel ở UsersModule
      { name: Warning.name, schema: WarningSchema },
    ]),
    AuthModule,
    NotificationsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
