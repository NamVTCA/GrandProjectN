import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import api from '../../../services/api';
import './PostCard.scss';

// Định nghĩa đầy đủ interface Post
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
}

// SỬA LỖI: Đảm bảo onInteraction được định nghĩa ở đây
interface PostCardProps {
  post: Post;
  onInteraction: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onInteraction }) => {
  const { user } = useAuth();
  const isLiked = user ? post.likes.includes(user._id) : false;

  const handleLike = async () => {
    if (!user) return; // Không cho phép thích nếu chưa đăng nhập
    try {
      // Gửi yêu cầu API ở chế độ nền
      api.post(`/posts/${post._id}/like`);
      // Gọi callback ngay lập tức để cập nhật UI "lạc quan"
      onInteraction();
    } catch (error) {
      console.error("Lỗi khi thích bài viết:", error);
      // (Nâng cao) Có thể thêm logic để revert lại UI nếu API thất bại
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
      </div>
      <div className="post-actions">
        <button onClick={handleLike} className={`action-button ${isLiked ? 'liked' : ''}`}>
          Thích
        </button>
        <button className="action-button">Bình luận</button>
        <button className="action-button">Chia sẻ</button>
      </div>
    </div>
  );
};

export default PostCard;
