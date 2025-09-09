// src/types/index.ts

// Dựa trên user.schema.ts
export interface User {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  avatar: string;
  coverImage: string;
  bio?: string;
  interests: string[];
  level: number;
  xp: number;
  coins: number;
  roles: ('user' | 'moderator' | 'admin')[];
}

// Dựa trên post.schema.ts
export interface Post {
  _id: string;
  author: User; // Lồng thông tin tác giả vào bài đăng
  content: string;
  media: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  // ... và các trường khác bạn cần hiển thị
}