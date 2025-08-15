import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OnEvent } from '@nestjs/event-emitter'; // 1. Import OnEvent

import {
  Notification,
  NotificationDocument,
  NotificationType,
} from './schemas/notification.schema';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { NotificationsGateway } from './notifications.gateway';
import { PresenceService } from '../presence/presence.service';

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

  // Hàm createNotification của bạn đã rất tốt, giữ nguyên
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

    // Gửi tín hiệu real-time
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

  // ✅ THÊM HÀM NÀY VÀO
  // Hàm này sẽ tự động chạy mỗi khi có sự kiện 'notification.create' được phát ra
  // Hàm này sẽ tự động chạy mỗi khi có sự kiện 'notification.create'
  @OnEvent('notification.create')
  async handleNotificationCreateEvent(payload: {
    recipientId: string;
    actor: UserDocument;
    type: NotificationType;
    link?: string;
  }) {
    // 3. ✅ DÙNG ID ĐỂ TÌM KIẾM USER ĐẦY ĐỦ
    const recipient = await this.userModel.findById(payload.recipientId);
    if (!recipient) {
      console.error(
        `Không tìm thấy người dùng nhận thông báo với ID: ${payload.recipientId}`,
      );
      return; // Dừng lại nếu không tìm thấy người nhận
    }

    // 4. ✅ TẠO THÔNG BÁO VỚI DỮ LIỆU ĐÃ ĐƯỢC CHUẨN HÓA
    // Logic tạo và gửi real-time đã nằm trong hàm này nên không cần lặp lại
    await this.createNotification(
      recipient,
      payload.actor,
      payload.type,
      payload.link || null,
    );
  }
  // notifications.service.ts
  async deleteNotification(notificationId: string, userId: string) {
    return this.notificationModel.findOneAndDelete({
      _id: notificationId,
      recipient: userId,
    });
  }

  async clearAllNotifications(userId: string) {
    return this.notificationModel.deleteMany({ recipient: userId });
  }
}
