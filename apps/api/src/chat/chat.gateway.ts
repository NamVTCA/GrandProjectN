import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { ChatService } from './chat.service';
import { ChatbotService } from '../chatbot/chatbot.service';
import { ConfigService } from '@nestjs/config';
import { PresenceService } from '../presence/presence.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private chatbotUserId: string;

  constructor(
    private chatService: ChatService,
    private chatbotService: ChatbotService,
    private configService: ConfigService,
    private presenceService: PresenceService,
  ) {
    const chatbotUserId = this.configService.get<string>('CHATBOT_USER_ID');
    if (!chatbotUserId) {
      throw new Error('CHATBOT_USER_ID is not defined in configuration');
    }
    this.chatbotUserId = chatbotUserId;
  }

  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('ChatGateway');

  // THÊM LẠI HÀM NÀY ĐỂ SỬA LỖI
  afterInit(server: Server) {
    this.logger.log('ChatGateway Initialized!');
  }

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected to Chat: ${client.id}`);
    try {
      const token = client.handshake.headers.authorization?.split(' ')[1];
      if (!token) throw new Error('No token');
      const user = await this.chatService.getUserFromSocket(token);
      client.data.user = user;
    } catch (e) {
      this.logger.error('Chat Auth error', e);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from Chat: ${client.id}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(client: Socket, payload: { chatroomId: string; content: string }): Promise<void> {
    const user = client.data.user;
    const message = await this.chatService.createMessage(user, payload.chatroomId, payload.content);

    const chatroom = await this.chatService.findRoomById(payload.chatroomId);
    if (!chatroom) return;

    for (const member of chatroom.members) {
      const memberId = member.user.toString();
      if (await this.presenceService.isUserOnline(memberId)) {
        const memberSocketId = this.presenceService.getSocketId(memberId);
        if (memberSocketId) {
          this.server.to(memberSocketId).emit('newMessage', message);
        }
      }
    }

    const isWithChatbot = chatroom.members.some(member => member.user.toString() === this.chatbotUserId);
    if (isWithChatbot) {
        const botResponseContent = await this.chatbotService.getResponse(payload.content);
        const botMessage = await this.chatService.createBotMessage(this.chatbotUserId, payload.chatroomId, botResponseContent);
        // Gửi tin nhắn của bot đến phòng chat, nhưng không cần lặp lại vì client đã ở trong phòng
        this.server.to(client.id).emit('newMessage', botMessage);
    }
  }

  @SubscribeMessage('mark_room_as_read')
  async handleMarkAsRead(client: Socket, payload: { chatroomId: string }) {
    const user = client.data.user;
    await this.chatService.markRoomAsRead(user._id, payload.chatroomId);
    client.emit('room_marked_as_read', { chatroomId: payload.chatroomId });
  }
}