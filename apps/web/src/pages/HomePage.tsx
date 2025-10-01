import React, { useEffect, useState, useCallback } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../services/api';
import CreatePost from '../features/feed/components/CreatePost';
import PostCard from '../features/feed/components/PostCard';
import type { Post, ReactionType, PostVisibility } from '../features/feed/types/Post';
import { useAuth } from '../features/auth/AuthContext';
// import ChatbotIcon from './ChatbotIcon';
import './HomePage.scss';

const HomePage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/posts/feed');
      if (Array.isArray(response.data)) {
        setPosts(response.data);
      } else {
        console.error("Dữ liệu trả về không hợp lệ:", response.data);
        setPosts([]);
      }
    } catch (error) {
      console.error("Lỗi khi tải bài đăng:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePostCreated = (newPost: Post) => {
    setPosts(currentPosts => [newPost, ...currentPosts]);
  };

  const handlePostUpdated = (updatedPost: Post) => {
    setPosts(currentPosts =>
      currentPosts.map(p => (p._id === updatedPost._id ? updatedPost : p))
    );
  };

  const handleReact = useCallback(async (postId: string, reactionType: ReactionType) => {
    try {
      const response = await api.post(`/posts/${postId}/react`, { type: reactionType });
      setPosts(currentPosts =>
        currentPosts.map(p => (p._id === postId ? (response.data as Post) : p))
      );
    } catch (error) {
      console.error("Lỗi khi bày tỏ cảm xúc:", error);
    }
  }, []);

  const handleRepost = useCallback(async (postId: string, content: string, visibility: PostVisibility) => {
    try {
      const response = await api.post(`/posts/${postId}/repost`, { content, visibility });
      handlePostCreated(response.data as Post);
    } catch (error) {
      console.error("Lỗi khi chia sẻ bài viết:", error);
    }
  }, []);
  
  const handlePostDeleted = useCallback(async (postId: string) => {
    try {
      await api.delete(`/posts/${postId}`);
      setPosts(currentPosts => currentPosts.filter(p => p._id !== postId));
    } catch (error) {
      console.error("Lỗi khi xóa bài viết:", error);
    }
  }, []);

  const handleCommentAdded = useCallback(async (postId: string) => {
    try {
      const response = await api.get(`/posts/${postId}`);
      setPosts(currentPosts => currentPosts.map(p => 
        p._id === postId ? (response.data as Post) : p
      ));
    } catch (error) {
      console.error("Lỗi khi cập nhật số bình luận:", error);
    }
  }, []);

  const handleCommentDeleted = useCallback(async (postId: string) => {
    try {
      const response = await api.get(`/posts/${postId}`);
      setPosts(currentPosts => currentPosts.map(p => 
        p._id === postId ? (response.data as Post) : p
      ));
    } catch (error) {
      console.error("Lỗi khi cập nhật số bình luận:", error);
    }
  }, []);

  if (loading) return <p className="page-status">Đang tải bài đăng...</p>;

  return (
    <div className="home-page">
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
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
              onPostUpdated={handlePostUpdated}
            />
          ))
        ) : (
          <p className="page-status">Bảng tin của bạn chưa có gì. Hãy kết bạn để xem thêm nhé!</p>
        )}
      </div>
      {/* <ChatbotIcon /> */}
    </div>
  );
};

export default HomePage;