import {
  Injectable,
  BadRequestException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';
import { PresenceService } from '../presence/presence.service';
import { IgdbGameDto } from './dto/igdb-game.dto';

interface IgdbGame {
  id: number;
  name: string;
  cover?: {
    image_id: string;
  };
}

@Injectable()
export class GameActivityService implements OnModuleInit {
  private accessToken: string;
  private readonly igdbApiUrl = 'https://api.igdb.com/v4';
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly logger = new Logger(GameActivityService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private notificationsService: NotificationsService,
    private presenceService: PresenceService,
  ) {
    this.clientId = this.configService.get<string>('IGDB_CLIENT_ID') ?? '';
    this.clientSecret =
      this.configService.get<string>('IGDB_CLIENT_SECRET') ?? '';
  }

  async onModuleInit() {
    await this.authenticate();
  }

  private async authenticate() {
    if (!this.clientId || !this.clientSecret) {
      this.logger.error('IGDB Client ID or Secret is not configured.');
      return;
    }
    const authUrl = `https://id.twitch.tv/oauth2/token?client_id=${this.clientId}&client_secret=${this.clientSecret}&grant_type=client_credentials`;
    try {
      const response = await firstValueFrom(this.httpService.post(authUrl));
      this.accessToken = response.data.access_token;
      this.logger.log('Successfully authenticated with IGDB/Twitch.');
    } catch (error) {
      this.logger.error(
        'Failed to authenticate with IGDB/Twitch',
        error.response?.data,
      );
    }
  }

  async searchGames(query: string): Promise<IgdbGameDto[]> {
    if (!this.accessToken) await this.authenticate();

    const body = `search "${query}"; fields name, cover.image_id; limit 20;`;
    try {
      const response = await firstValueFrom(
        this.httpService.post<IgdbGameDto[]>(`${this.igdbApiUrl}/games`, body, {
          headers: {
            'Client-ID': this.clientId,
            Authorization: `Bearer ${this.accessToken}`,
            Accept: 'application/json',
          },
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        'Error searching games from IGDB:',
        error.response?.data,
      );
      return [];
    }
  }

  async setPlayingStatus(
    userId: string,
    gameId: number,
  ): Promise<UserDocument> {
    const gameDetails = await this.getGameDetails(gameId);
    if (!gameDetails || !gameDetails.id) {
      throw new BadRequestException(
        'Không tìm thấy thông tin game với ID đã cung cấp.',
      );
    }

    const gameStatus = {
      igdbId: gameDetails.id.toString(),
      name: gameDetails.name,
      boxArtUrl: gameDetails.cover
        ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${gameDetails.cover.image_id}.jpg`
        : '',
    };

    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: { currentGame: gameStatus } },
      { new: true },
    );
    if (!updatedUser) {
      throw new Error('User not found');
    }
    return updatedUser;
  }

  private async getGameDetails(gameId: number): Promise<IgdbGameDto> {
    const body = `fields name, cover.image_id; where id = ${gameId};`;
    const response = await firstValueFrom(
      this.httpService.post<IgdbGameDto[]>(`${this.igdbApiUrl}/games`, body, {
        headers: {
          'Client-ID': this.clientId,
          Authorization: `Bearer ${this.accessToken}`,
          Accept: 'application/json',
        },
      }),
    );
    if (!response.data || response.data.length === 0) {
      throw new BadRequestException(`Không tìm thấy game với ID ${gameId}`);
    }
    return response.data[0];
  }

  // HÀM MỚI: Mời bạn bè chơi game
  async inviteFriendToPlay(
    inviter: UserDocument,
    friendId: string,
  ): Promise<{ message: string }> {
    // 1. Kiểm tra xem người được mời có phải là bạn bè không
    const isFriend = inviter.friends.some((id) => id.toString() === friendId);
    if (!isFriend) {
      throw new BadRequestException(
        'Bạn chỉ có thể mời những người có trong danh sách bạn bè.',
      );
    }

    // 2. Kiểm tra xem người mời có đang chơi game không
    if (!inviter.currentGame?.name) {
      throw new BadRequestException(
        'Bạn cần phải ở trong một game để có thể mời người khác.',
      );
    }

    // 3. Kiểm tra xem người bạn đó có online không
    if (!(await this.presenceService.isUserOnline(friendId))) {
      return { message: 'Người bạn này hiện không online.' };
    }

    // 4. Lấy thông tin người được mời để gửi thông báo
    const friend = await this.userModel.findById(friendId);
    if (!friend) {
      throw new BadRequestException('Không tìm thấy người dùng được mời.');
    }

    // 5. Tạo và gửi thông báo mời chơi game
    await this.notificationsService.createNotification(
      friend,
      inviter,
      NotificationType.GAME_INVITE,
      null, // Không cần link
      {
        gameName: inviter.currentGame.name,
        boxArtUrl: inviter.currentGame.boxArtUrl,
      },
    );

    return {
      message: `Đã gửi lời mời chơi ${inviter.currentGame.name} đến ${friend.username}.`,
    };
  }
}
