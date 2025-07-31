import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Notification,
  NotificationDocument,
  NotificationType,
} from './schemas/notification.schema';
import { UserDocument } from '../auth/schemas/user.schema';
import { NotificationsGateway } from './notifications.gateway';
import { PresenceService } from '../presence/presence.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    private notificationsGateway: NotificationsGateway,
    private presenceService: PresenceService,
  ) {}

  async createNotification(
    recipient: UserDocument,
    sender: UserDocument,
    type: NotificationType,
    link: string | null,
    metadata?: any,
  ) {
    if (recipient._id.toString() === sender._id.toString()) return;

    const notification = new this.notificationModel({
      recipient: recipient._id,
      sender: sender._id,
      type,
      link,
      metadata,
    });

    const savedNotification = await notification.save();
    const populatedNotification = await savedNotification.populate(
      'sender',
      'username avatar',
    );

    if (await this.presenceService.isUserOnline(recipient._id.toString())) {
      const socketId = this.presenceService.getSocketId(
        recipient._id.toString(),
      );
      if (socketId) {
        this.notificationsGateway.sendNotificationToUser(
          socketId,
          populatedNotification,
        );
      }
    }
    return populatedNotification;
  }

  async getNotificationsForUser(userId: string): Promise<Notification[]> {
    return this.notificationModel
      .find({ recipient: userId })
      .populate('sender', 'username avatar')
      .sort({ createdAt: -1 })
      .exec();
  }

  async markAsRead(
    notificationId: string,
    userId: string,
  ): Promise<Notification | null> {
    return this.notificationModel.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true },
      { new: true },
    );
  }
  async getAllNotification(recivedId: string) {
    const notifications = await this.notificationModel
      .find({ recipient: recivedId })
      .sort({ createdAt: -1 }) // mới nhất lên đầu
      .populate('sender', 'username avatar') // chỉ lấy username, avatar của người gửi
      .exec();

    return notifications;
  }
}
