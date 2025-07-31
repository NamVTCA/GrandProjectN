import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { User } from '../../auth/schemas/user.schema';
import { Group } from '../../groups/schemas/group.schema';
import { Reaction, ReactionSchema } from './reaction.schema'; // <-- IMPORT SCHEMA MỚI

export type PostDocument = Post & Document;

export enum ModerationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PROCESSING = 'PROCESSING', // Trạng thái mới cho video
}
export enum PostVisibility {
  PUBLIC = 'PUBLIC',
  FRIENDS_ONLY = 'FRIENDS_ONLY',
  PRIVATE = 'PRIVATE',
}
@Schema({ timestamps: true })
export class Post {
  @Prop({ enum: ModerationStatus, default: ModerationStatus.PENDING })
  moderationStatus: ModerationStatus;

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  author: User; // Tác giả bài viết

  @Prop({ required: false, trim: true })
  content: string; // Nội dung text

  @Prop([String])
  mediaUrls: string[]; // Mảng chứa URL của ảnh/video

  // --- THAY ĐỔI TỪ `likes` SANG `reactions` ---
  @Prop({ type: [ReactionSchema], default: [] })
  reactions: Reaction[]; // Mảng chứa các cảm xúc

  @Prop({ default: 0 })
  commentCount: number;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: false })
  group?: Group;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: false })
  repostOf?: Post;

  @Prop({ default: 0 })
  repostCount: number;
  @Prop({ enum: PostVisibility, default: PostVisibility.PUBLIC })
  visibility: PostVisibility;
}

export const PostSchema = SchemaFactory.createForClass(Post);
