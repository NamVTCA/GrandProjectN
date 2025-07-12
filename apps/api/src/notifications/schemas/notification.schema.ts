import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { User } from '../../auth/schemas/user.schema';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  NEW_LIKE = 'NEW_LIKE',
  NEW_COMMENT = 'NEW_COMMENT',
  NEW_FOLLOWER = 'NEW_FOLLOWER',
  GAME_INVITE = 'GAME_INVITE',
  NEW_REACTION = 'NEW_REACTION',
}

@Schema({ timestamps: true })
export class Notification {
  
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  recipient: User; // Người nhận

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  sender: User; // Người gây ra sự kiện

  @Prop({ required: true, enum: NotificationType })
  type: NotificationType;

  @Prop({ default: false })
  isRead: boolean;

  @Prop()
  link?: string;
  @Prop({ type: Object })
  metadata?: {
    gameName?: string;
    boxArtUrl?: string;
  };

  
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
