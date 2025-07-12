import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import PostCard from '../features/feed/components/PostCard';
import type { Post } from '../features/feed/components/PostCard';
import CreatePost from '../features/feed/components/CreatePost';
import { useAuth } from '../features/auth/AuthContext';

const HomePage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/posts');
      setPosts(response.data);
    } catch (error) {
      console.error("Lỗi khi tải bài đăng:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleInteraction = (postId: string, action: 'like' | 'repost') => {
    if (!user) return;

    if (action === 'like') {
      setPosts(currentPosts =>
        currentPosts.map(p => {
          if (p._id === postId) {
            const isAlreadyLiked = p.likes.includes(user._id);
            return {
              ...p,
              likes: isAlreadyLiked
                ? p.likes.filter(id => id !== user._id)
                : [...p.likes, user._id],
            };
          }
          return p;
        })
      );
    }

    if (action === 'repost') {
        // Đối với repost, cách tốt nhất là làm mới lại toàn bộ
        // để thấy bài đăng mới của chính mình
        setTimeout(() => fetchPosts(), 500);
    }
  };

  if (loading) return <p>Đang tải bài đăng...</p>;

  return (
    <div className="home-page">
      <CreatePost onPostCreated={fetchPosts} />
      <div className="feed-container">
        {posts.map((post) => (
          <PostCard key={post._id} post={post} onInteraction={handleInteraction} />
        ))}
      </div>
    </div>
  );
};

export default HomePage;