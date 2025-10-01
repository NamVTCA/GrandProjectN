import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult, Model } from 'mongoose';
import { OnEvent } from '@nestjs/event-emitter';

import {
  Notification,
  NotificationDocument,
  NotificationType,
} from './schemas/notification.schema';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { NotificationsGateway } from './notifications.gateway';
import { PresenceService } from '../presence/presence.service';

type CreateNotificationEvent = {
  recipientId: string;
  actor?: UserDocument;
  type: NotificationType;
  link?: string | null;
  metadata?: Record<string, any>;
};

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private notificationsGateway: NotificationsGateway,
    private presenceService: PresenceService,
  ) {}

  // ✅ Tạo + push realtime
  async createNotification(
    recipient: UserDocument,
    sender: UserDocument | null | undefined,
    type: NotificationType,
    link: string | null,
    metadata?: any,
  ) {
    if (sender && recipient._id.toString() === sender._id.toString()) return;

    const payload: any = {
      recipient: recipient._id,
      type,
      link,
      metadata,
    };
    if (sender) payload.sender = sender._id;

    const notification = new this.notificationModel(payload);
    const savedNotification = await notification.save();

    const populatedNotification = await savedNotification.populate(
      'sender',
      'username avatar',
    );

    // realtime nếu user online
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
    return this.notificationModel
      .find({ recipient: recivedId })
      .sort({ createdAt: -1 })
      .populate('sender', 'username avatar')
      .exec();
  }

  // ⬇️ Lắng nghe sự kiện từ module khác
  @OnEvent('notification.create')
  async handleNotificationCreateEvent(payload: CreateNotificationEvent) {
    const recipient = await this.userModel.findById(payload.recipientId);
    if (!recipient) {
      console.error(
        `Không tìm thấy người nhận thông báo: ${payload.recipientId}`,
      );
      return;
    }

    await this.createNotification(
      recipient,
      payload.actor ?? null,
      payload.type,
      payload.link ?? null,
      payload.metadata ?? undefined,
    );
  }

  async deleteNotification(notificationId: string, userId: string) {
    return this.notificationModel.findOneAndDelete({
      _id: notificationId,
      recipient: userId,
    });
  }

  async clearAllNotifications(userId: string): Promise<DeleteResult> {
    return this.notificationModel.deleteMany({ recipient: userId });
  }
}
