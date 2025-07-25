// apps/api/src/users/users.service.ts
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';
import * as schedule from 'node-schedule';

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
    await this.receiveXP(
      2,
      'follow',
      currentUserId.toString(),
      userIdToFollow.toString(),
    );
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
        { $set: { interests: interestIds, hasSelectedInterests: true } },
        { new: true },
      )
      .populate('interests');

    if (!updatedUser) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return updatedUser;
  }
  async receiveXP(
    xp: number,
    kind: string,
    userId: string,
    follow?: string,
  ): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      console.warn(`User with ID ${userId} not found.`);
      return;
    }

    if (kind === 'follow') {
      await this.handleUserFollowed(userId); // gọi xử lý bonus milestone
    }

    // Chặn cộng quá giới hạn trong ngày
    if (user.xp_per_day >= 250) {
      await this.notificationsService.createNotification(
        user,
        user,
        NotificationType.NEW_NOTIFICATION,
        null,
      );
      console.log(`User ${user.username} reached daily XP limit.`);
      return;
    }

    const allowedXP = Math.max(0, 250 - user.xp_per_day);
    xp = Math.min(xp, allowedXP);
    user.xp_per_day += xp;
    user.xp += xp;
    await user.save();
  }
  async handleUserFollowed(followedUserId: string): Promise<void> {
    const user = await this.userModel.findById(followedUserId);
    if (!user) {
      console.warn(`User with ID ${followedUserId} not found.`);
      return;
    }

    const baseXP = 20;
    const canAddBase = Math.max(0, 250 - user.xp_per_day);
    const baseAdded = Math.min(baseXP, canAddBase);
    user.xp_per_day += baseAdded;
    user.xp += baseAdded; // ✅ Cộng vào tổng XP

    const currentFollowers = user.followers?.length || 0;
    const milestones = [
      { count: 10, bonusXP: 100 },
      { count: 50, bonusXP: 300 },
      { count: 100, bonusXP: 800 },
      { count: 500, bonusXP: 3000 },
      { count: 1000, bonusXP: 7000 },
    ];

    user.milestonesReached ??= [];

    for (const milestone of milestones) {
      if (
        currentFollowers >= milestone.count &&
        !user.milestonesReached.includes(milestone.count)
      ) {
        const canAddBonus = Math.max(0, 250 - user.xp_per_day);
        const bonusAdded = Math.min(canAddBonus, milestone.bonusXP);

        user.xp_per_day += bonusAdded;
        user.xp += bonusAdded; // ✅ Cộng vào tổng XP

        user.milestonesReached.push(milestone.count);

        console.log(
          `User ${user.username} đạt mốc ${milestone.count} follower. Cộng bonus ${bonusAdded} XP.`,
        );
      }
    }

    await user.save();
  }
}
