import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserDocument } from '../auth/schemas/user.schema';
import { FriendRequestStatus } from './schemas/friend-request.schema';

@UseGuards(JwtAuthGuard)
@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Post('request/:recipientId')
  sendRequest(@GetUser() user: UserDocument, @Param('recipientId') recipientId: string) {
    return this.friendsService.sendRequest(user, recipientId);
  }

  @Post('response/:requestId')
  respondToRequest(
    @GetUser() user: UserDocument,
    @Param('requestId') requestId: string,
    @Body('status') status: FriendRequestStatus.ACCEPTED | FriendRequestStatus.REJECTED,
  ) {
    return this.friendsService.respondToRequest(user, requestId, status);
  }

  @Get('me')
  getMyFriends(@GetUser() user: UserDocument) {
      return this.friendsService.getMyFriends(user);
  }
}