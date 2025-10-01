import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UsersService } from './users.service';
import { UsersController } from './users.controller';

import { User, UserSchema } from '../auth/schemas/user.schema';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { Post, PostSchema } from '../posts/schemas/post.schema';
import { CommentSchema } from '../posts/schemas/comment.schema';
import { GroupSchema } from 'src/groups/schemas/group.schema';

// Keep Warning model from main branch
import { Warning, WarningSchema } from './schemas/warning.schema'; // note: path normalized

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Post.name, schema: PostSchema },
      { name: Warning.name, schema: WarningSchema },

      // If you don't have classes for these, use string tokens:
      { name: 'Comment', schema: CommentSchema },
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
