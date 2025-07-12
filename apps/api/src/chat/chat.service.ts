import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chatroom, ChatroomDocument } from './schemas/chatroom.schema';
import { Message, MessageDocument } from './schemas/message.schema';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chatroom.name) private chatroomModel: Model<ChatroomDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  // --- Các hàm cho Gateway ---
  async getUserFromSocket(token: string): Promise<UserDocument> {
    const payload = this.jwtService.verify(token);
    if (!payload.sub) throw new UnauthorizedException();
    const user = await this.userModel.findById(payload.sub);
    if (!user) throw new UnauthorizedException();
    return user;
  }

  async createMessage(sender: UserDocument, chatroomId: string, content: string) {
    const chatroom = await this.chatroomModel.findById(chatroomId);
    if (!chatroom) throw new Error('Phòng chat không tồn tại');

    const message = new this.messageModel({
      sender: sender._id,
      chatroom: chatroomId,
      content,
      readBy: [sender._id],
    });

    const savedMessage = await message.save();

    chatroom.lastMessage = savedMessage._id as any;
    chatroom.members.forEach(member => {
        if (member.user.toString() !== sender._id.toString()) {
            member.unreadCount += 1;
        }
    });
    await chatroom.save();

    return savedMessage.populate('sender', 'username avatar');
  }

  async markRoomAsRead(userId: string, chatroomId: string) {
    await this.chatroomModel.updateOne(
        { _id: chatroomId, 'members.user': userId },
        { $set: { 'members.$.unreadCount': 0 } }
    );
  }

  async findRoomById(id: string): Promise<ChatroomDocument | null> {
    return this.chatroomModel.findById(id).exec();
  }

  async createBotMessage(senderId: string, chatroomId: string, content: string) {
    const message = new this.messageModel({ sender: senderId, chatroom: chatroomId, content });
    return (await message.save()).populate('sender', 'username avatar');
  }

  // --- Các hàm cho Controller ---
  async createChatroom(creator: UserDocument, memberIds: string[]): Promise<Chatroom> {
    const allMemberIds = [creator._id, ...memberIds];
    const members = allMemberIds.map(id => ({ user: id, unreadCount: 0 }));

    const newRoom = new this.chatroomModel({
      members: members,
      isGroupChat: members.length > 2,
    });
    return newRoom.save();
  }

  async findRoomsForUser(user: UserDocument): Promise<Chatroom[]> {
    return this.chatroomModel.find({ 'members.user': user._id })
      .populate('members.user', 'username avatar')
      .populate('lastMessage')
      .sort({ updatedAt: -1 })
      .exec();
  }

  async findMessagesInRoom(chatroomId: string): Promise<Message[]> {
    return this.messageModel
      .find({ chatroom: chatroomId })
      .populate('sender', 'username avatar')
      .sort({ createdAt: 'asc' })
      .exec();
  }
}
