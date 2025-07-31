// File: src/features/feed/types/Post.ts

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
export type PostVisibility = 'PUBLIC' | 'FRIENDS_ONLY' | 'PRIVATE';

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
}

export interface Post {
  _id: string;
  content: string;
  mediaUrls: string[];
  author: Author;
  reactions: Reaction[];
  commentCount: number;
  repostCount: number;
  createdAt: string;
  visibility: PostVisibility; // ✅ Sử dụng type đã định nghĩa
  repostOf?: Post;
}
