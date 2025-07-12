// File: src/pages/HomePage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import CreatePost from '../features/feed/components/CreatePost';
import PostCard from '../features/feed/components/PostCard';
import type { Post, ReactionType } from '../features/feed/types/Post';
import { useAuth } from '../features/auth/AuthContext';
import './HomePage.scss';

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

  const handleReact = useCallback(async (postId: string, reactionType: ReactionType) => {
    if (!user) return;

    // Cập nhật UI lạc quan (optimistic update)
    setPosts(currentPosts => 
      currentPosts.map(p => {
        if (p._id === postId) {
          const existingReactionIndex = p.reactions.findIndex(r => r.user === user._id);
          const newReactions = [...p.reactions];

          if (existingReactionIndex > -1) {
            if (newReactions[existingReactionIndex].type === reactionType) {
              // Nếu người dùng bấm lại vào reaction cũ -> Bỏ reaction
              newReactions.splice(existingReactionIndex, 1);
            } else {
              // Nếu người dùng chọn reaction khác -> Cập nhật
              newReactions[existingReactionIndex].type = reactionType;
            }
          } else {
            // Nếu người dùng chưa react -> Thêm reaction mới
            newReactions.push({ user: user._id, type: reactionType });
          }
          return { ...p, reactions: newReactions };
        }
        return p;
      })
    );

    // Gửi yêu cầu lên server
    try {
      await api.post(`/posts/${postId}/react`, { type: reactionType });
    } catch (error) {
      console.error("Lỗi khi bày tỏ cảm xúc:", error);
      // Nếu có lỗi, tải lại toàn bộ dữ liệu để đảm bảo đồng bộ
      fetchPosts(); 
    }
  }, [user, fetchPosts]);

  const handleRepost = useCallback(async (postId: string) => {
    try {
      // Logic cho repost có thể phức tạp hơn, ví dụ: mở một modal để người dùng nhập thêm nội dung
      // Tạm thời, chúng ta chỉ gọi API và làm mới lại feed
      await api.post(`/posts/${postId}/repost`, {});
      fetchPosts(); // Tải lại toàn bộ feed để thấy bài đăng mới
    } catch (error) {
      console.error("Lỗi khi chia sẻ bài viết:", error);
    }
  }, [fetchPosts]);

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
            />
          ))
        ) : (
          <p className="page-status">Chưa có bài đăng nào. Hãy là người đầu tiên!</p>
        )}
      </div>
    </div>
  );
};

export default HomePage;