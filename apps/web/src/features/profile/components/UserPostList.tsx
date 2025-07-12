// File: src/features/profile/components/UserPostList.tsx (Cập nhật)
import React, { useEffect, useState, useCallback } from 'react';
import api from '../../../services/api';
import PostCard from '../../feed/components/PostCard';
import type { Post } from '../../feed/types/Post';
import './UserPostList.scss';

interface UserPostListProps {
  userId: string;
}

const UserPostList: React.FC<UserPostListProps> = ({ userId }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserPosts = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await api.get(`/posts/user/${userId}`);
      setPosts(response.data);
    } catch (error) {
      console.error("Lỗi khi tải bài đăng của người dùng:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserPosts();
  }, [fetchUserPosts]);

  if (loading) return <p>Đang tải bài đăng...</p>;
  if (posts.length === 0) return <p>Người dùng này chưa có bài đăng nào.</p>;

  return (
    <div className="user-post-list">
      {posts.map((post) => (
        <PostCard 
          key={post._id} 
          post={post} 
          onReact={() => {}} 
          onRepost={() => {}}
        />
      ))}
    </div>
  );
};
export default UserPostList;