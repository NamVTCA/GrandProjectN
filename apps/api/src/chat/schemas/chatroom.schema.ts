import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { User } from '../../auth/schemas/user.schema';
import { Message } from './message.schema';

export type ChatroomDocument = Chatroom & Document;

@Schema({ _id: false })
class ChatMemberInfo {
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  user: User;

  @Prop({ default: 0 })
  unreadCount: number;
}
const ChatMemberInfoSchema = SchemaFactory.createForClass(ChatMemberInfo);

@Schema({ timestamps: true })
export class Chatroom {
  @Prop({ trim: true })
  name?: string;

  @Prop()
  avatar?: string; // ✅ Thêm avatar nhóm

  @Prop({ required: true, type: [ChatMemberInfoSchema] })
  members: ChatMemberInfo[];

  @Prop({ default: false })
  isGroupChat: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Message' })
  lastMessage?: Message;
}
export const ChatroomSchema = SchemaFactory.createForClass(Chatroom);

ChatroomSchema.index({ 'members.user': 1 });
ChatroomSchema.index({ updatedAt: -1 });
