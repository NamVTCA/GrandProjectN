import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

// Post schema (đúng như bạn đang làm)
import { Post, PostSchema } from '../posts/schemas/post.schema';

// ⬇️ THÊM Comment schema
import { CommentSchema } from '../posts/schemas/comment.schema';
import { GroupSchema } from 'src/groups/schemas/group.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },   // 'User'
      { name: Post.name, schema: PostSchema },   // 'Post'
      { name: 'Comment', schema: CommentSchema }, // ⬅️ ĐĂNG KÝ CommentModel với token 'Comment'
      { name: 'Group', schema: GroupSchema },
    ]),
    AuthModule,
    NotificationsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
