import React, { useEffect, useState, useCallback } from 'react'; // Sửa lỗi: Thêm useCallback
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

  // Sửa lỗi: Triển khai logic "Optimistic UI"
  const handleLikeToggle = (postId: string) => {
    if (!user) return;

    setPosts(currentPosts =>
      currentPosts.map(p => {
        if (p._id === postId) {
          const isAlreadyLiked = p.likes.includes(user._id);
          if (isAlreadyLiked) {
            // Bỏ thích: Loại bỏ user ID và giảm số like
            return {
              ...p,
              likes: p.likes.filter(id => id !== user._id),
            };
          } else {
            // Thích: Thêm user ID và tăng số like
            return {
              ...p,
              likes: [...p.likes, user._id],
            };
          }
        }
        return p;
      })
    );
  };

  if (loading) return <p>Đang tải bài đăng...</p>;

  return (
    <div className="home-page">
      <CreatePost onPostCreated={fetchPosts} />
      <div className="feed-container">
        {posts.map((post) => (
          <PostCard key={post._id} post={post} onInteraction={() => handleLikeToggle(post._id)} />
        ))}
      </div>
    </div>
  );
};

export default HomePage;