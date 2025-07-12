import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { User } from '../../auth/schemas/user.schema';
import { Post } from './post.schema';

export type CommentDocument = Comment & Document;

export enum ModerationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Schema({ timestamps: true })
export class Comment {
  @Prop({ enum: ModerationStatus, default: ModerationStatus.PENDING })
  moderationStatus: ModerationStatus;
  
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  author: User;

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Post' })
  post: Post; // Bài viết mà bình luận này thuộc về

  @Prop({ required: true, trim: true })
  content: string;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] })
  likes: User[];
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
