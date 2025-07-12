import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../auth/schemas/user.schema';

@WebSocketGateway({ namespace: 'webrtc', cors: { origin: '*' } })
export class WebRTCGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('WebRTCGateway');

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  // --- Quản lý kết nối ---
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.headers.authorization?.split(' ')[1];
      if (!token) throw new Error('No token provided');
      
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });
      const user = await this.userModel.findById(payload.sub).select('username avatar');
      if (!user) throw new Error('User not found');

      client.data.user = user; // Gắn thông tin user vào socket
      this.logger.log(`Client connected: ${user.username} (${client.id})`);
    } catch (e) {
      this.logger.error(`Authentication failed: ${e.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.data.user?.username || client.id}`);
  }

  // --- Xử lý tín hiệu WebRTC ---

  @SubscribeMessage('join-call')
  handleJoinCall(
    @MessageBody() data: { roomId: string }, // **[SỬA]** Dùng roomId chung
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `call-${data.roomId}`;
    client.join(roomName);
    this.logger.log(`${client.data.user.username} joined call in room ${data.roomId}`);

    // Thông báo cho những người khác trong phòng rằng có người mới tham gia
    client.to(roomName).emit('user-joined', {
      socketId: client.id,
      user: client.data.user,
    });
  }

  @SubscribeMessage('leave-call')
  handleLeaveCall(
    @MessageBody() data: { roomId: string }, // **[SỬA]** Dùng roomId chung
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `call-${data.roomId}`;
    client.to(roomName).emit('user-left', { socketId: client.id });
    client.leave(roomName);
    this.logger.log(`${client.data.user.username} left call in room ${data.roomId}`);
  }

  @SubscribeMessage('offer')
  handleOffer(
    @MessageBody() data: { targetSocketId: string; sdp: any },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Relaying offer from ${client.id} to ${data.targetSocketId}`);
    // Gửi offer đến một client cụ thể
    this.server.to(data.targetSocketId).emit('offer', {
      fromSocketId: client.id,
      sdp: data.sdp,
    });
  }

  @SubscribeMessage('answer')
  handleAnswer(
    @MessageBody() data: { targetSocketId: string; sdp: any },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Relaying answer from ${client.id} to ${data.targetSocketId}`);
    this.server.to(data.targetSocketId).emit('answer', {
      fromSocketId: client.id,
      sdp: data.sdp,
    });
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(
    @MessageBody() data: { targetSocketId: string; candidate: any },
    @ConnectedSocket() client: Socket,
  ) {
    this.server.to(data.targetSocketId).emit('ice-candidate', {
      fromSocketId: client.id,
      candidate: data.candidate,
    });
  }
}