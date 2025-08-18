import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { ChatService } from './chat.service';
import { ChatbotService } from '../chatbot/chatbot.service';
import { ConfigService } from '@nestjs/config';
import { PresenceService } from '../presence/presence.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private chatbotUserId: string;

  constructor(
    // ✅ QUAN TRỌNG: dùng forwardRef để phá vòng phụ thuộc với ChatService
    @Inject(forwardRef(() => ChatService))
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

  // 👇 tiện ích: để ChatService có thể broadcast phòng mới tạo
  public broadcastRoomCreated(room: any) {
    this.server.emit('room_created', room);
  }

  // lấy token từ nhiều vị trí (auth.token, query.token, header Authorization)
  private extractToken(client: Socket): string | null {
    const authToken = (client.handshake as any)?.auth?.token as string | undefined;
    const queryToken = (client.handshake as any)?.query?.token as string | undefined;
    const headerAuth = client.handshake.headers?.authorization as string | undefined;
    if (authToken) return authToken;
    if (queryToken) return queryToken;
    if (headerAuth) {
      return headerAuth.startsWith('Bearer ') ? headerAuth.slice(7) : headerAuth;
    }
    return null;
  }

  // đảm bảo đã xác thực, set client.data.user nếu chưa có
  private async ensureUser(client: Socket) {
    if ((client.data as any)?.user) return (client.data as any).user;
    const token = this.extractToken(client);
    if (!token) throw new Error('No token');
    const user = await this.chatService.getUserFromSocket(token);
    (client.data as any).user = user;
    return user;
  }

  afterInit(server: Server) {
    this.logger.log('ChatGateway Initialized!');
  }

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected to Chat: ${client.id}`);
    try {
      const authToken = (client.handshake as any).auth?.token as string | undefined;
      const queryToken = (client.handshake.query?.token as string) || undefined;
      const headerAuth = client.handshake.headers.authorization as string | undefined;

      let token = authToken || queryToken;
      if (!token && headerAuth) {
        token = headerAuth.startsWith('Bearer ') ? headerAuth.slice(7) : headerAuth;
      }
      if (!token) throw new Error('No token');

      this.logger.debug?.(
        `[ChatGateway] handshake tokens -> auth:${!!authToken} query:${!!queryToken} header:${!!headerAuth}`
      );

      const user = await this.chatService.getUserFromSocket(token);
      client.data.user = user;
    } catch (e) {
      this.logger.error('Chat Auth error', e);
      client.emit('error', { message: 'Unauthorized' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from Chat: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(client: Socket, payload: { chatroomId: string }) {
    try {
      const user = await this.ensureUser(client);
      const chatroomId = payload?.chatroomId;
      if (!chatroomId) {
        client.emit('error', { message: 'chatroomId is required' });
        return;
      }
      const ok = await this.chatService.isMemberOfRoom(user._id, chatroomId);
      if (!ok) {
        client.emit('error', { message: 'Not allowed' });
        return;
      }
      await client.join(chatroomId);
      client.emit('joinedRoom', { chatroomId });
    } catch (e: any) {
      this.logger.error('joinRoom error', e);
      client.emit('error', { message: e?.message || 'Join room failed' });
    }
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(client: Socket, payload: { chatroomId: string }) {
    try {
      const chatroomId = payload?.chatroomId;
      if (!chatroomId) {
        client.emit('error', { message: 'chatroomId is required' });
        return;
      }
      await client.leave(chatroomId);
    } catch (e: any) {
      this.logger.error('leaveRoom error', e);
      client.emit('error', { message: e?.message || 'Leave room failed' });
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(client: Socket, payload: { chatroomId: string; content: string }): Promise<void> {
    try {
      const user = await this.ensureUser(client);
      const chatroomId = payload?.chatroomId;
      const content = payload?.content ?? '';

      if (!chatroomId) {
        client.emit('error', { message: 'chatroomId is required' });
        return;
      }
      if (!content.trim()) {
        client.emit('error', { message: 'Content is empty' });
        return;
      }

      const allowed = await this.chatService.isMemberOfRoom(user._id, chatroomId);
      if (!allowed) {
        client.emit('error', { message: 'Not allowed' });
        return;
      }

      const message = await this.chatService.createMessage(user, chatroomId, content);
      this.server.to(chatroomId).emit('newMessage', message);

      const chatroom = await this.chatService.findRoomById(chatroomId);
      if (!chatroom) return;

      const isWithChatbot = chatroom.members.some(member => (member.user as any).toString?.() === this.chatbotUserId);
      if (isWithChatbot) {
        const botResponseContent = await this.chatbotService.getResponse(content);
        const botMessage = await this.chatService.createBotMessage(this.chatbotUserId, chatroomId, botResponseContent);
        this.server.to(chatroomId).emit('newMessage', botMessage);
      }
    } catch (e: any) {
      this.logger.error('sendMessage error', e);
      client.emit('error', { message: e?.response?.message || e?.message || 'Send message failed' });
    }
  }

  @SubscribeMessage('mark_room_as_read')
  async handleMarkAsRead(client: Socket, payload: { chatroomId: string }) {
    try {
      const user = await this.ensureUser(client);
      const chatroomId = payload?.chatroomId;
      if (!chatroomId) {
        client.emit('error', { message: 'chatroomId is required' });
        return;
      }
      await this.chatService.markRoomAsRead(user._id, chatroomId);
      client.emit('room_marked_as_read', { chatroomId });
    } catch (e: any) {
      this.logger.error('mark_room_as_read error', e);
      client.emit('error', { message: e?.message || 'Mark read failed' });
    }
  }
}
