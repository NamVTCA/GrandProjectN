// File: src/features/feed/components/PostCard.tsx (Cập nhật)
import React from 'react';
import { Link } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaRegCommentAlt, FaShare } from 'react-icons/fa';
import type { Post, ReactionType } from '../types/Post';
import { ReactionTypes } from '../types/Post'; // Import object hằng số
import { useAuth } from '../../auth/AuthContext';
import './PostCard.scss';

interface PostCardProps {
  post: Post;
  onReact: (postId: string, reaction: ReactionType) => void;
  onRepost: (postId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onReact, onRepost }) => {
  const { user } = useAuth();
  const currentUserReaction = user ? post.reactions.find(r => r.user === user._id) : null;

  return (
    <div className="post-card">
      <div className="post-header">
        <Link to={`/profile/${post.author.username}`} className="author-info">
          <img src={post.author.avatar || 'https://via.placeholder.com/48'} alt={post.author.username} />
          <div>
            <strong>{post.author.username}</strong>
            <span className="timestamp">{new Date(post.createdAt).toLocaleString()}</span>
          </div>
        </Link>
      </div>
      <p className="post-content">{post.content}</p>
      <div className="post-stats">
        {post.reactions.length > 0 && <span>{post.reactions.length} lượt thích</span>}
        {post.commentCount > 0 && <span>{post.commentCount} bình luận</span>}
      </div>
      <div className="post-actions">
        <button 
          onClick={() => onReact(post._id, ReactionTypes.LIKE)} // SỬA LỖI: Sử dụng hằng số
          className={`action-button ${currentUserReaction?.type === 'LIKE' ? 'liked' : ''}`}
        >
          {currentUserReaction?.type === 'LIKE' ? <FaHeart /> : <FaRegHeart />} Thích
        </button>
        <button className="action-button">
          <FaRegCommentAlt /> Bình luận
        </button>
        <button onClick={() => onRepost(post._id)} className="action-button">
          <FaShare /> Chia sẻ
        </button>
      </div>
    </div>
  );
};
export default PostCard;