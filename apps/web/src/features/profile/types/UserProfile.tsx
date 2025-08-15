export interface UserProfile {
  _id: string;
  username: string;
  name?: string;
  email: string;
  avatar?: string;
  coverImage?: string;
  bio?: string;
  followers: string[];
  following: string[];
  createdAt: string;
  xp: number;
  xpToNextLevel: number;
  globalRole: 'USER' | 'MODERATOR' | 'ADMIN';
  accountStatus?: 'ACTIVE' | 'SUSPENDED' | 'BANNED'; // Thêm trường mới
  suspensionExpires?: Date; // Thêm trường mới

  equippedAvatarFrame?: {
    _id: string;
    name: string;
    assetUrl: string;
    type?: string;
  };
}