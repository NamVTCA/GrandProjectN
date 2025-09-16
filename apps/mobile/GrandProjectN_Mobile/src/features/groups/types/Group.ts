import type { UserProfile } from '../../profile/types/UserProfile';

export interface Interest {
  _id: string;
  name: string;
}

export interface GroupMember {
  _id: string;
  user: UserProfile;
  role: 'MEMBER' | 'ADMIN' | 'OWNER';
  joinedAt: string;
  xp: number;
  level: number;
}

export interface JoinRequest {
  _id: string;
  user: UserProfile;
  group: string;
  status: 'PENDING';
  createdAt: string;
}

export interface Group {
  _id: string;
  name: string;
  description: string;
  owner: UserProfile;
  interests: Interest[];
  privacy: 'public' | 'private';
  avatar?: string;
  coverImage?: string;
  memberCount: number;
}

export interface GroupDetail extends Group {
  members: GroupMember[];
}