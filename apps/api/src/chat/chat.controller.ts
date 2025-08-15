import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ValidationPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserDocument } from '../auth/schemas/user.schema';
import { CreateRoomDto } from './dto/create-room.dto';

@UseGuards(JwtAuthGuard)
@Controller('chat') // nếu set globalPrefix('api') thì URL là /api/chat/rooms
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('rooms')
  @UseInterceptors(FileInterceptor('avatar')) // <-- tên field phải là 'avatar'
  createRoom(
    @GetUser() user: UserDocument,
    @UploadedFile() avatar: Express.Multer.File | undefined,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    createRoomDto: CreateRoomDto,
  ) {
    return this.chatService.createChatroom(
      user,
      createRoomDto.memberIds,
      createRoomDto.name,
      avatar, // truyền file thật xuống service
    );
  }

  @Get('rooms')
  findRooms(@GetUser() user: UserDocument) {
    return this.chatService.findRoomsForUser(user);
  }

  @Get('rooms/:id/messages')
  findMessages(@GetUser() user: UserDocument, @Param('id') chatroomId: string) {
    return this.chatService.findMessagesInRoomForUser(user._id, chatroomId);
  }
}
