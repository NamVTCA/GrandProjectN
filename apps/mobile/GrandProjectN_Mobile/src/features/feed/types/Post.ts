export enum PostVisibility {
  PUBLIC = 'PUBLIC',
  FRIENDS_ONLY = 'FRIENDS_ONLY',
  PRIVATE = 'PRIVATE'
}

export enum ReactionTypes {
  LIKE = 'LIKE',
  LOVE = 'LOVE',
  HAHA = 'HAHA',
  WOW = 'WOW',
  SAD = 'SAD',
  ANGRY = 'ANGRY'
}

export type ReactionType = keyof typeof ReactionTypes;

export interface User {
  _id: string;
  username: string;
  avatarUrl?: string;
  avatar?: string;
  avatar_url?: string;
  globalRole?: 'ADMIN' | 'USER';
}

export interface Reaction {
  _id: string;
  user: string;
  type: ReactionType;
  createdAt: string;
}

export interface Comment {
  _id: string;
  author: User;
  content: string;
  createdAt: string;
  updatedAt: string;
  replyCount?: number;
  replies?: Comment[];
  parentComment?: string;
}

export interface Post {
  _id: string;
  author: User;
  content: string;
  mediaUrls: string[];
  reactions: Reaction[];
  comments: Comment[];
  commentCount: number;
  repostCount: number;
  repostOf?: Post;
  createdAt: string;
  updatedAt: string;
  visibility: PostVisibility;
  group?: {
    _id: string;
    name: string;
  };
}

export interface CreatePostRequest {
  content: string;
  mediaUrls?: string[];
  groupId?: string;
  visibility?: PostVisibility;
}

export interface UpdatePostRequest {
  content?: string;
  mediaUrls?: string[];
  visibility?: PostVisibility;
}

export interface ReactToPostRequest {
  reaction: ReactionType;
}

export interface CreateCommentRequest {
  content: string;
  parentCommentId?: string;
}