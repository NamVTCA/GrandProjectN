import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import CreatePost from '../features/feed/components/CreatePost';
import PostCard from '../features/feed/components/PostCard';
import type { Post, ReactionType, PostVisibility } from '../features/feed/types/Post';
import { useAuth } from '../features/auth/AuthContext';
import ChatbotIcon from './ChatbotIcon';
import './HomePage.scss';

const HomePage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

const fetchPosts = useCallback(async () => {
  setLoading(true);
  try {
    const response = await api.get('/posts/feed');
    // Đảm bảo response.data là mảng Post[]
    if (Array.isArray(response.data)) {
      setPosts(response.data);
    } else {
      console.error("Dữ liệu trả về không hợp lệ:", response.data);
      setPosts([]);
    }
  } catch (error) {
    console.error("Lỗi khi tải bài đăng:", error);
    setPosts([]); // Đặt posts thành mảng rỗng nếu có lỗi
  } finally {
    setLoading(false);
  }
}, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Áp dụng "Cập nhật lạc quan" cho bài viết mới
  const handlePostCreated = (newPost: Post) => {
    setPosts(currentPosts => [newPost, ...currentPosts]);
  };

  const handleReact = useCallback(async (postId: string, reactionType: ReactionType) => {
    try {
      const response = await api.post(`/posts/${postId}/react`, { type: reactionType });
      setPosts(currentPosts =>
        currentPosts.map(p => (p._id === postId ? response.data : p))
      );
    } catch (error) {
      console.error("Lỗi khi bày tỏ cảm xúc:", error);
    }
  }, []);

  const handleRepost = useCallback(async (postId: string, content: string, visibility: PostVisibility) => {
    try {
      const response = await api.post(`/posts/${postId}/repost`, { content, visibility });
      handlePostCreated(response.data); // Tái sử dụng logic cập nhật lạc quan
    } catch (error) {
      console.error("Lỗi khi chia sẻ bài viết:", error);
    }
  }, []);
  
  const handlePostDeleted = useCallback((postId: string) => {
    setPosts(currentPosts => currentPosts.filter(p => p._id !== postId));
    // Yêu cầu xóa API vẫn được gửi đi trong nền
    api.delete(`/posts/${postId}`).catch(err => console.error("Lỗi khi xóa bài viết:", err));
  }, []);

  const handleCommentAdded = useCallback((postId: string) => {
    setPosts(currentPosts => currentPosts.map(p => {
      if (p._id === postId) {
        return { ...p, commentCount: p.commentCount + 1 };
      }
      return p;
    }));
  }, []);

  const handleCommentDeleted = useCallback((postId: string) => {
    setPosts(currentPosts =>
      currentPosts.map(p =>
        p._id === postId ? { ...p, commentCount: Math.max(0, p.commentCount - 1) } : p
      )
    );
  }, []);

  if (loading) return <p className="page-status">Đang tải bài đăng...</p>;

  return (
    <div className="home-page">
      <CreatePost onPostCreated={handlePostCreated} />
      <div className="feed-container">
        {posts.length > 0 ? (
          posts.map((post) => (
            <PostCard 
              key={post._id}
              post={post}
              onReact={handleReact}
              onRepost={handleRepost}
              onPostDeleted={handlePostDeleted}
              onCommentAdded={handleCommentAdded} 
              onCommentDeleted={handleCommentDeleted}
            />
          ))
        ) : (
          <p className="page-status">Bảng tin của bạn chưa có gì. Hãy kết bạn để xem thêm nhé!</p>
        )}
      </div>
      <ChatbotIcon />
    </div>
  );
};

export default HomePage;