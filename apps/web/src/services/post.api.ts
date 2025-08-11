import api from './api';
import type { Post, Comment, ReactionType } from '../features/feed/types/Post';

// Định nghĩa kiểu dữ liệu cho payload khi tạo bài viết
interface CreatePostPayload {
  content: string;
  mediaUrls: string[];
  groupId?: string;
  visibility: 'PUBLIC' | 'FRIENDS_ONLY' | 'PRIVATE';
}

// Lấy tất cả bài viết trong một nhóm cụ thể
export const getPostsByGroup = (groupId: string): Promise<Post[]> =>
  api.get(`/posts/group/${groupId}`).then((res) => res.data);

// Tạo một bài viết mới
export const createPost = (payload: CreatePostPayload): Promise<Post> =>
  api.post('/posts', payload).then((res) => res.data);

// Xóa một bài viết
export const deletePost = (postId: string): Promise<void> =>
  api.delete(`/posts/${postId}`).then((res) => res.data);

// Bày tỏ cảm xúc với bài viết
export const reactToPost = (
  postId: string,
  type: ReactionType,
): Promise<Post> =>
  api.post(`/posts/${postId}/react`, { type }).then((res) => res.data);

// Lấy bình luận của một bài viết
export const getComments = (postId: string): Promise<Comment[]> =>
  api.get(`/posts/${postId}/comments`).then((res) => res.data);

// Tạo một bình luận mới
export const createComment = (
  postId: string,
  content: string,
): Promise<Comment> =>
  api.post(`/posts/${postId}/comments`, { content }).then((res) => res.data);

// Xóa một bình luận
export const deleteComment = (commentId: string): Promise<void> =>
  api.delete(`/posts/comments/${commentId}`).then((res) => res.data);
