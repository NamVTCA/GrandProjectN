import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserDocument } from '../auth/schemas/user.schema';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('rooms')
  createRoom(@GetUser() user: UserDocument, @Body('memberIds') memberIds: string[]) {
    return this.chatService.createChatroom(user, memberIds);
  }

  @Get('rooms')
  findRooms(@GetUser() user: UserDocument) {
    return this.chatService.findRoomsForUser(user);
  }

  @Get('rooms/:id/messages')
  findMessages(@Param('id') chatroomId: string) {
    return this.chatService.findMessagesInRoom(chatroomId);
  }
}
