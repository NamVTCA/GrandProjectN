import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { FriendRequest, FriendRequestDocument, FriendRequestStatus } from './schemas/friend-request.schema';

@Injectable()
export class FriendsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(FriendRequest.name) private friendRequestModel: Model<FriendRequestDocument>,
  ) {}

  async sendRequest(sender: UserDocument, recipientId: string) {
    if (sender._id.toString() === recipientId) {
      throw new BadRequestException('Bạn không thể tự kết bạn với chính mình.');
    }
    // ... (Thêm logic kiểm tra đã là bạn, hoặc đã gửi yêu cầu chưa)

    const newRequest = new this.friendRequestModel({ sender: sender._id, recipient: recipientId });
    await newRequest.save();
    // (Nâng cao) Gửi thông báo cho người nhận
    return { message: 'Đã gửi lời mời kết bạn.' };
  }

  async respondToRequest(user: UserDocument, requestId: string, status: FriendRequestStatus.ACCEPTED | FriendRequestStatus.REJECTED) {
    const request = await this.friendRequestModel.findById(requestId);
    if (!request || request.recipient.toString() !== user._id.toString()) {
      throw new NotFoundException('Không tìm thấy lời mời kết bạn.');
    }

    request.status = status;
    await request.save();

    if (status === FriendRequestStatus.ACCEPTED) {
      // Thêm vào danh sách bạn bè của cả hai người
      await this.userModel.findByIdAndUpdate(request.sender, { $addToSet: { friends: request.recipient } });
      await this.userModel.findByIdAndUpdate(request.recipient, { $addToSet: { friends: request.sender } });
    }

    return { message: `Đã ${status === 'ACCEPTED' ? 'chấp nhận' : 'từ chối'} lời mời.` };
  }

  async getMyFriends(user: UserDocument) {
      const userData = await this.userModel.findById(user._id).populate('friends', 'username avatar');
      return userData ? userData.friends : [];
  }
}
