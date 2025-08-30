// File: src/features/feed/types/Post.ts

import type { User } from "../../auth/AuthContext";
import type { Group } from "../../groups/types/Group";

export type ReactionType = 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY';

export const ReactionTypes: { [key: string]: ReactionType } = {
  LIKE: 'LIKE',
  LOVE: 'LOVE',
  HAHA: 'HAHA',
  WOW: 'WOW',
  SAD: 'SAD',
  ANGRY: 'ANGRY',
};

// ✅ Thêm type PostVisibility để dùng lại
export const PostVisibility = {
  PUBLIC: 'PUBLIC',
  FRIENDS_ONLY: 'FRIENDS_ONLY',
  PRIVATE: 'PRIVATE',
} as const;

export type PostVisibility = typeof PostVisibility[keyof typeof PostVisibility];


export interface Post {
  _id: string;
  content: string;
  mediaUrls: string[];
  visibility: PostVisibility;
  createdAt: string;
  updatedAt: string;
  author: any;
  reactions: any[];
  repostOf?: Post;
  repostCount?: number;
  commentCount: number;
  group?: any;
}


export interface Author {
  _id: string;
  username: string;
  avatarUrl?: string;
}

export interface Reaction {
  user: string;
  type: ReactionType;
}

export interface Comment {
  _id: string;
  content: string;
  author: Author;
  createdAt: string;
  replyCount: number; // Đổi thành bắt buộc, mặc định là 0
  parentComment?: string;
  replies?: Comment[];
}