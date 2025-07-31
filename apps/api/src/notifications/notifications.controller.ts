import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserDocument } from '../auth/schemas/user.schema';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getNotifications(@GetUser() user: UserDocument) {
    return this.notificationsService.getNotificationsForUser(
      user._id.toString(),
    );
  }

  @Patch(':id/read')
  markAsRead(
    @Param('id') notificationId: string,
    @GetUser() user: UserDocument,
  ) {
    return this.notificationsService.markAsRead(
      notificationId,
      user._id.toString(),
    );
  }
  @Get('/all')
  @UseGuards(JwtAuthGuard)
  async getMyNotifications(@GetUser() user: UserDocument) {
    return this.notificationsService.getAllNotification(user._id.toString());
  }
}
