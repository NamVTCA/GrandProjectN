import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
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

  async getUserFromSocket(token: string): Promise<UserDocument> {
    let payload: any;
    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException();
    }
    if (!payload.sub) throw new UnauthorizedException();
    const user = await this.userModel.findById(payload.sub);
    if (!user) throw new UnauthorizedException();
    return user;
  }

  getUserById(id: string) {
    return this.userModel.findById(id);
  }

  private toObjectId(id: string | Types.ObjectId | UserDocument | any): Types.ObjectId {
    if (!id) throw new Error('Invalid id');
    if (id instanceof Types.ObjectId) return id;
    if (typeof id === 'string') return new Types.ObjectId(id);
    if (typeof id === 'object' && id._id) {
      const inner = id._id;
      if (inner instanceof Types.ObjectId) return inner;
      return new Types.ObjectId(String(inner));
    }
    return new Types.ObjectId(String(id));
  }

  async isMemberOfRoom(userId: string | Types.ObjectId, roomId: string) {
    const uid = this.toObjectId(userId as any);
    const rid = this.toObjectId(roomId as any);
    const count = await this.chatroomModel.countDocuments({ _id: rid, 'members.user': uid });
    return count > 0;
  }

  private async isBlockedBetween(
    userAId: string | Types.ObjectId | UserDocument | any,
    userBId: string | Types.ObjectId | UserDocument | any
  ): Promise<boolean> {
    const A = this.toObjectId(userAId);
    const B = this.toObjectId(userBId);
    const [a, b] = await Promise.all([
      this.userModel.findById(A).select('_id blockedUsers').lean(),
      this.userModel.findById(B).select('_id blockedUsers').lean(),
    ]);
    if (!a || !b) return false;
    const aBlockedB =
      Array.isArray((a as any).blockedUsers) &&
      (a as any).blockedUsers.some((id: any) => id.toString() === B.toString());
    const bBlockedA =
      Array.isArray((b as any).blockedUsers) &&
      (b as any).blockedUsers.some((id: any) => id.toString() === A.toString());
    return aBlockedB || bBlockedA;
  }

  async createMessage(sender: UserDocument, chatroomId: string, content: string) {
    if (!content || !content.trim()) throw new Error('Phòng chat không tồn tại hoặc nội dung rỗng');
    const chatroom = await this.chatroomModel.findOne({ _id: chatroomId, 'members.user': sender._id });
    if (!chatroom) throw new Error('Phòng chat không tồn tại hoặc bạn không có quyền');

    if (!chatroom.isGroupChat && Array.isArray(chatroom.members) && chatroom.members.length === 2) {
      const other = chatroom.members.find(
        m => this.toObjectId(m.user).toString() !== this.toObjectId(sender._id).toString()
      );
      if (other) {
        const otherId = this.toObjectId(other.user);
        if (await this.isBlockedBetween(sender._id, otherId)) {
          throw new ForbiddenException('You cannot message this user.');
        }
      }
    }

    const message = new this.messageModel({
      sender: sender._id,
      chatroom: chatroomId,
      content: content.trim(),
      readBy: [sender._id],
    });

    const savedMessage = await message.save();

    chatroom.lastMessage = savedMessage._id as any;
    chatroom.members.forEach(member => {
      if (this.toObjectId(member.user).toString() !== this.toObjectId(sender._id).toString()) {
        member.unreadCount += 1;
      }
    });
    await chatroom.save();

    return savedMessage.populate('sender', 'username avatar');
  }

  async markRoomAsRead(userId: string | Types.ObjectId, chatroomId: string) {
    const uid = this.toObjectId(userId as any);
    const rid = this.toObjectId(chatroomId as any);
    await this.chatroomModel.updateOne(
      { _id: rid, 'members.user': uid },
      { $set: { 'members.$.unreadCount': 0 } }
    );
    await this.messageModel.updateMany(
      { chatroom: rid, readBy: { $ne: uid } },
      { $addToSet: { readBy: uid } }
    );
  }

  async findRoomById(id: string): Promise<ChatroomDocument | null> {
    return this.chatroomModel.findById(id).exec();
  }

  async createBotMessage(senderId: string, chatroomId: string, content: string) {
    const message = new this.messageModel({ sender: senderId, chatroom: chatroomId, content });
    return (await message.save()).populate('sender', 'username avatar');
  }

  async createChatroom(
    creator: UserDocument,
    memberIds: string[],
    name?: string,
    avatar?: Express.Multer.File, // <-- nhận file thật
  ): Promise<Chatroom> {
    const uniqueIds = Array.from(
      new Set([creator._id.toString(), ...memberIds.map(String)])
    ).map(id => new Types.ObjectId(id));

    const isGroup = uniqueIds.length > 2;

    // ✅ DM: kiểm tra block 2 chiều
    if (!isGroup && uniqueIds.length === 2) {
      const [u1, u2] = uniqueIds;
      if (await this.isBlockedBetween(u1, u2)) {
        throw new ForbiddenException('Cannot create/open a DM due to blocking');
      }

      // ✅ DM: nếu đã tồn tại thì mở lại phòng cũ
      const existing = await this.chatroomModel.findOne({
        isGroupChat: false,
        'members.user': { $all: [u1, u2] },
        $expr: { $eq: [{ $size: '$members' }, 2] },
      });
      if (existing) return existing;
    }

    // ✅ Group: luôn tạo mới
    const members = uniqueIds.map(id => ({ user: id, unreadCount: 0 }));

    // Tạo đường dẫn/URL cho avatar nếu có file (tuỳ cấu hình Multer của bạn)
    let avatarPath: string | undefined;
    if (avatar) {
      // ví dụ bạn dùng disk storage với dest: 'uploads/'
      // có thể thay bằng URL S3/Cloudinary nếu bạn upload lên cloud
      if (avatar.filename) {
        avatarPath = `/uploads/${avatar.filename}`;
      } else if ((avatar as any).path) {
        avatarPath = String((avatar as any).path).replace(/^.*uploads[\\/]/, '/uploads/');
      }
    }

    const newRoom = new this.chatroomModel({
      name: name?.trim() || undefined,
      avatar: avatarPath || undefined, // lưu string URL/path
      members,
      isGroupChat: isGroup,
    });
    return newRoom.save();
  }

  async findRoomsForUser(user: UserDocument): Promise<Chatroom[]> {
    return this.chatroomModel
      .find({ 'members.user': user._id })
      .populate('members.user', 'username avatar')
      .populate('lastMessage')
      .sort({ updatedAt: -1 })
      .exec();
  }

  async findMessagesInRoomForUser(userId: string | Types.ObjectId, chatroomId: string): Promise<Message[]> {
    const ok = await this.isMemberOfRoom(userId, chatroomId);
    if (!ok) throw new UnauthorizedException();
    return this.messageModel
      .find({ chatroom: chatroomId })
      .populate('sender', 'username avatar')
      .sort({ createdAt: 'asc' })
      .exec();
  }
}
