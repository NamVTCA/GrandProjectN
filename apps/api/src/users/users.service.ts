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
  async receiveXP(xp: number, kind: string, userId: string): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      console.warn(`User with ID ${userId} not found.`);
      return;
    }

    if (user.xp_per_day + xp > 250) {
      const allowedXP = 250 - user.xp_per_day;
      if (allowedXP <= 0) {
        console.log(`User ${user.username} reached daily XP limit.`);
        return;
      }
      xp = allowedXP;
    }

    user.xp_per_day += xp;
    await user.save();

    console.log(`User ${user.username} received ${xp} XP from action: ${kind}`);
  }

  private scheduleDailyXPReset() {
    schedule.scheduleJob('1 0 * * *', async () => {
      const result = await this.userModel.updateMany({}, { xp_per_day: 0 });
      console.log(
        `Reset daily XP for all users. Modified: ${result.modifiedCount}`,
      );
    });
  }
  async handleUserFollowed(followedUserId: string): Promise<void> {
    const user = await this.userModel.findById(followedUserId);
    if (!user) {
      alert(`User with ID ${followedUserId} not found.`);
      return;
    }

    const baseXP = 20;
    user.xp_per_day = Math.min(user.xp_per_day + baseXP, 250);

    const currentFollowers = user.followers.length;

    const milestones = [
      { count: 10, bonusXP: 100 },
      { count: 50, bonusXP: 300 },
      { count: 100, bonusXP: 800 },
      { count: 500, bonusXP: 3000 },
      { count: 1000, bonusXP: 7000 },
    ];

    if (!user.milestonesReached) user.milestonesReached = [];

    for (const milestone of milestones) {
      if (
        currentFollowers >= milestone.count &&
        !user.milestonesReached.includes(milestone.count)
      ) {
        const bonus = milestone.bonusXP;
        const canAdd = Math.max(0, 250 - user.xp_per_day);
        const actualBonus = Math.min(canAdd, bonus);
        user.xp_per_day += actualBonus;

        user.milestonesReached.push(milestone.count);

        console.log(
          `User ${user.username} đạt mốc ${milestone.count} follower. Cộng bonus ${actualBonus} XP.`,
        );
      }
    }

    await user.save();
  }
}
