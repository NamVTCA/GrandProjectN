import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import api from '../../../services/api';
import { FaHeart, FaRegHeart, FaCommentAlt, FaShare } from 'react-icons/fa';
import './PostCard.scss';

export interface Post {
  _id: string;
  content: string;
  author: {
    _id: string;
    username: string;
    avatar: string;
  };
  createdAt: string;
  likes: string[];
  commentCount: number;
  repostCount: number;
}

interface PostCardProps {
  post: Post;
  onInteraction: (postId: string, action: 'like' | 'repost') => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onInteraction }) => {
  const { user } = useAuth();
  const isLiked = user ? post.likes.includes(user._id) : false;

  const handleLike = async () => {
    if (!user) return;
    onInteraction(post._id, 'like'); // Cập nhật UI lạc quan
    try {
      await api.post(`/posts/${post._id}/like`);
    } catch (error) {
      console.error("Lỗi khi thích bài viết:", error);
      // (Nâng cao) Thêm logic để revert lại UI nếu API thất bại
    }
  };

  const handleRepost = async () => {
    if (!user) return;
    onInteraction(post._id, 'repost');
    try {
      await api.post(`/posts/${post._id}/repost`);
    } catch (error) {
      console.error("Lỗi khi repost:", error);
    }
  };

  return (
    <div className="post-card">
      <div className="post-header">
        <Link to={`/profile/${post.author.username}`} className="author-info">
          <img src={post.author.avatar || 'https://via.placeholder.com/40'} alt={post.author.username} />
          <div>
            <strong>{post.author.username}</strong>
            <span className="timestamp">{new Date(post.createdAt).toLocaleString()}</span>
          </div>
        </Link>
      </div>
      <p className="post-content">{post.content}</p>
      <div className="post-stats">
        <span>{post.likes.length} lượt thích</span>
        <span>{post.commentCount} bình luận</span>
        <span>{post.repostCount} lượt chia sẻ</span>
      </div>
      <div className="post-actions">
        <button onClick={handleLike} className={`action-button ${isLiked ? 'liked' : ''}`}>
          <span className="icon">{isLiked ? <FaHeart /> : <FaRegHeart />}</span>
          Thích
        </button>
        <button className="action-button">
          <span className="icon"><FaCommentAlt /></span>
          Bình luận
        </button>
        <button onClick={handleRepost} className="action-button">
          <span className="icon"><FaShare /></span>
          Chia sẻ
        </button>
      </div>
    </div>
  );
};

export default PostCard;
