// apps/api/src/users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private notificationsService: NotificationsService,
  ) {}

  async findByUsername(username: string) {
    const user = await this.userModel
      .findOne({ username })
      .select('-password -email')
      .exec();

    if (!user) {
      throw new NotFoundException(`Không tìm thấy người dùng ${username}`);
    }
    return user;
  }

  async updateProfile(
    userId: string | Types.ObjectId,
    updateUserDto: UpdateUserDto,
  ) {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(userId, updateUserDto, { new: true })
      .select('-password')
      .exec();

    if (!updatedUser) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return updatedUser;
  }

  async followUser(
    currentUserId: string | Types.ObjectId,
    userIdToFollow: string,
  ) {
    if (currentUserId.toString() === userIdToFollow) {
      throw new Error('Bạn không thể tự theo dõi chính mình.');
    }

    await this.userModel.findByIdAndUpdate(currentUserId, {
      $addToSet: { following: userIdToFollow },
    });

    await this.userModel.findByIdAndUpdate(userIdToFollow, {
      $addToSet: { followers: currentUserId },
    });

    const userToFollowDoc = await this.userModel.findById(userIdToFollow);
    const currentUserDoc = await this.userModel.findById(currentUserId);

    if (!userToFollowDoc || !currentUserDoc) {
      throw new NotFoundException(
        'Không tìm thấy người dùng để tạo thông báo.',
      );
    }

    await this.notificationsService.createNotification(
      userToFollowDoc,
      currentUserDoc,
      NotificationType.NEW_FOLLOWER,
      `/profile/${currentUserDoc.username}`,
    );

    return { message: 'Theo dõi thành công.' };
  }

  async unfollowUser(
    currentUserId: string | Types.ObjectId,
    userIdToUnfollow: string,
  ) {
    await this.userModel.findByIdAndUpdate(currentUserId, {
      $pull: { following: userIdToUnfollow },
    });

    await this.userModel.findByIdAndUpdate(userIdToUnfollow, {
      $pull: { followers: currentUserId },
    });

    return { message: 'Bỏ theo dõi thành công.' };
  }

  async updateUserInterests(
    userId: string,
    interestIds: string[],
  ): Promise<UserDocument> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $set: { interests: interestIds, hasSelectedInterests: true  } },
        { new: true },
      )
      .populate('interests');

    if (!updatedUser) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return updatedUser;
  }
}
