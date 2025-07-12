import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, PresenceStatus } from '../auth/schemas/user.schema';

@Injectable()
export class PresenceService {
  private readonly connectedUsers = new Map<string, string>();

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  addUser(userId: string, socketId: string) {
    this.connectedUsers.set(userId, socketId);
  }

  removeUserBySocketId(socketId: string): string | null {
    for (const [userId, id] of this.connectedUsers.entries()) {
        if (id === socketId) {
            this.connectedUsers.delete(userId);
            return userId;
        }
    }
    return null;
  }

  getSocketId(userId: string): string | undefined {
    return this.connectedUsers.get(userId);
  }

  async isUserOnline(userId: string): Promise<boolean> {
    const user = await this.userModel.findById(userId).select('presenceStatus');
    if (!user || user.presenceStatus === PresenceStatus.OFFLINE) {
      return false;
    }
    return this.connectedUsers.has(userId);
  }

  async setPresenceStatus(userId: string, status: PresenceStatus): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(userId, { presenceStatus: status }, { new: true });
  }
}
