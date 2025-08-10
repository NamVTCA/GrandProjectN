import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { User } from '../../auth/schemas/user.schema';

export type NotificationDocument = Notification & Document;

// ✅ ĐÃ HOÀN THIỆN: Enum này giờ đã bao gồm tất cả các loại thông báo
export enum NotificationType {
  NEW_REACTION = 'NEW_REACTION', // Cho một lượt "thích" hoặc bày tỏ cảm xúc
  NEW_COMMENT = 'NEW_COMMENT', // Cho một bình luận mới
  NEW_FOLLOWER = 'NEW_FOLLOWER', // Cho một người theo dõi mới
  FRIEND_REQUEST = 'FRIEND_REQUEST', // Cho một lời mời kết bạn mới
  FRIEND_REQUEST_ACCEPTED = 'FRIEND_ACCEPTED', // cho một lời đồng ý kết bạn
  GAME_INVITE = 'GAME_INVITE', // Cho một lời mời chơi game
  NEW_NOTIFICATION = 'NEW_NOTIFICATION',
  WARN = 'WARN',
  GROUP_REQUEST_ACCEPTED = 'GROUP_REQUEST_ACCEPTED', // ✅ THÊM DÒNG NÀY
  GROUP_REQUEST_REJECTED = 'GROUP_REQUEST_REJECTED', // ✅ THÊM DÒNG NÀY
  GROUP_INVITE = 'GROUP_INVITE', 
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


