import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import CreatePost from '../features/feed/components/CreatePost';
import PostCard from '../features/feed/components/PostCard';
import type { Post, ReactionType } from '../features/feed/types/Post';
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
      const response = await api.get('/posts');
      const fetchedPosts: Post[] = response.data;

      // Lọc bài viết theo quyền hiển thị
      const visiblePosts = fetchedPosts.filter(post => {
        if (post.visibility === 'PUBLIC') return true;
        if (post.visibility === 'PRIVATE') return post.author._id === user?._id;
        if (post.visibility === 'FRIENDS_ONLY') {
          return (
            post.author._id === user?._id ||
            user?.friends?.includes(post.author._id)
          );
        }
        return false;
      });

      setPosts(visiblePosts);
    } catch (error) {
      console.error("Lỗi khi tải bài đăng:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

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

  const handleRepost = useCallback(async (postId: string, content: string) => {
    try {
      await api.post(`/posts/${postId}/repost`, {
        content,
        visibility: 'FRIENDS_ONLY' // mặc định chỉ bạn bè được xem
      });
      fetchPosts();
    } catch (error) {
      console.error("Lỗi khi chia sẻ bài viết:", error);
    }
  }, [fetchPosts]);
  
  const handlePostDeleted = useCallback((postId: string) => {
    setPosts(currentPosts => currentPosts.filter(p => p._id !== postId));
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
      <CreatePost onPostCreated={fetchPosts} />
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
          <p className="page-status">Chưa có bài đăng nào. Hãy là người đầu tiên!</p>
        )}
      </div>
      <ChatbotIcon />
    </div>
  );
};

export default HomePage;
