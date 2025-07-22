// File: src/features/feed/types/Post.ts

// Định nghĩa các loại cảm xúc hợp lệ
export type ReactionType = 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY';

// Object chứa các hằng số để dễ sử dụng
export const ReactionTypes: { [key: string]: ReactionType } = {
  LIKE: 'LIKE',
  LOVE: 'LOVE',
  HAHA: 'HAHA',
  WOW: 'WOW',
  SAD: 'SAD',
  ANGRY: 'ANGRY',
};

// --- CÁC INTERFACE CHÍNH ---

interface Author {
  _id: string;
  username: string;
  avatar?: string;
}

export interface Reaction {
  user: string; // Chỉ lưu ID của user
  type: ReactionType;
}

// FIX: Thêm interface Comment đã bị thiếu
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
  repostOf?: Post;
}
