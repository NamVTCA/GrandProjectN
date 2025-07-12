// File: src/features/feed/types/Post.ts (Cập nhật)
// SỬA LỖI: Thay thế `enum` bằng `type` để tương thích với cấu hình TypeScript
export type ReactionType = 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY';

// (Tùy chọn) Tạo một object chứa các hằng số để dễ sử dụng
export const ReactionTypes: { [key: string]: ReactionType } = {
  LIKE: 'LIKE',
  LOVE: 'LOVE',
  HAHA: 'HAHA',
  WOW: 'WOW',
  SAD: 'SAD',
  ANGRY: 'ANGRY',
};

export interface Reaction {
  user: string;
  type: ReactionType;
}

export interface Post {
  _id: string;
  content: string;
  mediaUrls: string[];
  author: {
    _id: string;
    username: string;
    avatar?: string;
  };
  reactions: Reaction[];
  commentCount: number;
  repostCount: number;
  createdAt: string;
  repostOf?: Post;
}