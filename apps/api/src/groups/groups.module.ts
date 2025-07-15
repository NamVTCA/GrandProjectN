import { Module } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Group, GroupSchema } from './schemas/group.schema';
import { GroupMember, GroupMemberSchema } from './schemas/group-member.schema';
import { AuthModule } from '../auth/auth.module';
import { RewardsModule } from '../rewards/rewards.module';
import { UsersModule } from '../users/users.module';
// --- BỔ SUNG CÁC IMPORT CÒN THIẾU ---
import { User, UserSchema } from '../auth/schemas/user.schema';
import { Post, PostSchema } from '../posts/schemas/post.schema';
import { Comment, CommentSchema } from '../posts/schemas/comment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      
      { name: Group.name, schema: GroupSchema },
      { name: GroupMember.name, schema: GroupMemberSchema },
      { name: User.name, schema: UserSchema },
      { name: Post.name, schema: PostSchema },
      { name: Comment.name, schema: CommentSchema },
    ]),
    AuthModule,
    RewardsModule,
    UsersModule, // <-- Thêm UsersModule để sử dụng UserService
  ],
  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [GroupsService], // Export để PostsModule có thể dùng
})
export class GroupsModule {}