import React, { useState, useEffect } from "react";
import type { JSX } from "react";
import { Link } from "react-router-dom";
import {
  FaRegHeart,
  FaHeart,
  FaRegCommentAlt,
  FaShare,
  FaEllipsisH,
  FaTrash,
  FaThumbsUp,
  FaLaughSquint,
  FaSurprise,
  FaSadTear,
  FaAngry,
} from "react-icons/fa";
import api from "../../../services/api";
import { useAuth } from "../../auth/AuthContext";
import type { Post, Comment, ReactionType } from "../types/Post";
import { ReactionTypes } from "../types/Post";
import "./PostCard.scss";

// --- Component con cho khu vực bình luận ---
const CommentSection: React.FC<{
  postId: string;
  onCommentAdded: () => void;
  onCommentDeleted: () => void;
}> = ({ postId, onCommentAdded,onCommentDeleted }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await api.get(`/posts/${postId}/comments`);
        setComments(response.data);
      } catch (error) {
        console.error("Lỗi khi tải bình luận:", error);
      }
    };
    fetchComments();
  }, [postId]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsLoading(true);
    try {
      const response = await api.post(`/posts/${postId}/comments`, {
        content: newComment,
      });
      setComments((prev) => [...prev, response.data]);
      setNewComment("");
      onCommentAdded();
    } catch (error) {
      console.error("Lỗi khi gửi bình luận:", error);
    } finally {
      setIsLoading(false);
    }
  };
const handleDeleteComment = async (commentId: string) => {
  if (!window.confirm("Bạn có chắc chắn muốn xóa bình luận này?")) return;

  try {
    await api.delete(`/posts/comments/${commentId}`);
    setComments((prev) => prev.filter((c) => c._id !== commentId));
    onCommentDeleted();
  } catch (error) {
    console.error("Lỗi khi xóa bình luận:", error);
  }
};
const { user } = useAuth();

  return (
    <div className="comment-section">
      <form onSubmit={handleCommentSubmit} className="comment-form">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Viết bình luận..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !newComment.trim()}>
          Gửi
        </button>
      </form>
      <div className="comment-list">
        {comments.map((comment) => (
        <div key={comment._id} className="comment">
  <img
    src={
      comment.author.avatar ||
      "https://placehold.co/32x32/242526/b0b3b8?text=..."
    }
    alt={comment.author.username}
    className="comment-author-avatar"
  />
  <div className="comment-content">
    <Link to={`/profile/${comment.author.username}`}>
      <strong>{comment.author.username}</strong>
    </Link>
    <p>{comment.content}</p>
  </div>
  {user?._id === comment.author._id && (
    <button
      className="comment-delete-button"
      onClick={() => handleDeleteComment(comment._id)}
      title="Xóa bình luận"
    >
      <FaTrash />
    </button>
  )}
</div>
        ))}
      </div>
    </div>
  );
};

// --- Component chính ---
interface PostCardProps {
  post: Post;
  onReact: (postId: string, reaction: ReactionType) => void;
  onRepost: (postId: string, content: string) => void;
  onPostDeleted: (postId: string) => void;
  onCommentAdded: (postId: string) => void;
  onCommentDeleted: (postId: string) => void;
}

// --- Helper object để map reaction với icon và màu sắc ---
const reactionDetails: {
  [key in ReactionType]: { icon: JSX.Element; text: string; color: string };
} = {
  LIKE: { icon: <FaThumbsUp />, text: "Thích", color: "#3ea6ff" },
  LOVE: { icon: <FaHeart />, text: "Yêu thích", color: "#ff4d6d" },
  HAHA: { icon: <FaLaughSquint />, text: "Haha", color: "#f7b928" },
  WOW: { icon: <FaSurprise />, text: "Wow", color: "#f7b928" },
  SAD: { icon: <FaSadTear />, text: "Buồn", color: "#f7b928" },
  ANGRY: { icon: <FaAngry />, text: "Phẫn nộ", color: "#e0245e" },
};

const PostCard: React.FC<PostCardProps> = ({
  post,
  onReact,
  onRepost,
  onPostDeleted,
  onCommentAdded,
  onCommentDeleted
}) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [isRepostModalOpen, setRepostModalOpen] = useState(false);
  const [repostContent, setRepostContent] = useState("");
  const [showReactions, setShowReactions] = useState(false);
const [localCommentCount, setLocalCommentCount] = useState(post.commentCount);

useEffect(() => {
  setLocalCommentCount(post.commentCount);
}, [post.commentCount]);
  if (!post || !post.author) {
    return <div className="post-card-error">Đang cập nhật bài viết...</div>;
  }

  const isAuthor = user?._id === post.author._id;
  const currentUserReaction = user
    ? post.reactions.find((r) => r.user === user._id)
    : null;

  const handleReact = (reaction: ReactionType) => {
    onReact(post._id, reaction);
  };

  const handleRepostSubmit = () => {
    onRepost(post._id, repostContent);
    setRepostModalOpen(false);
    setRepostContent("");
  };

  const handleDelete = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa bài đăng này?")) {
      onPostDeleted(post._id);
    }
  };

  const renderPostContent = (p: Post, isOriginalPost: boolean) => {
    if (!p || !p.author) {
      return (
        <div className="post-embed-error">
          Không thể tải nội dung bài viết được chia sẻ.
        </div>
      );
    }

    return (
      <>
        <div className="post-header">
          <Link to={`/profile/${p.author.username}`} className="author-info">
            <img
              src={
                p.author.avatar ||
                "https://placehold.co/48x48/242526/b0b3b8?text=..."
              }
              alt={p.author.username}
            />
            <div>
              <strong>{p.author.username}</strong>
              <span className="timestamp">
                {new Date(p.createdAt).toLocaleString()}
              </span>
            </div>
          </Link>
          {isAuthor && isOriginalPost && (
            <div className="post-options">
              <FaEllipsisH />
              <div className="options-menu">
                <button onClick={handleDelete}>
                  <FaTrash /> Xóa
                </button>
              </div>
            </div>
          )}
        </div>
        {p.content && <p className="post-content">{p.content}</p>}

        {p.mediaUrls && p.mediaUrls.length > 0 && (
          <div className="post-media">
            {p.mediaUrls.map((url) => {
              const isVideo = url.endsWith(".mp4") || url.includes("video");

              return isVideo ? (
                <video
                  key={url}
                  controls
                  width="100%"
                  height="auto"
                  onError={(e) => {
                    const videoElement = e.currentTarget;
                    videoElement.poster =
                      "https://placehold.co/600x400/242526/e4e6eb?text=Lỗi+tải+video";
                  }}
                >
                  <source src={url} type="video/mp4" />
                  Trình duyệt không hỗ trợ video.
                </video>
              ) : (
                <img
                  key={url}
                  src={url}
                  alt="Nội dung bài đăng"
                  onError={(e) =>
                    (e.currentTarget.src =
                      "https://placehold.co/600x400/242526/e4e6eb?text=Lỗi+tải+ảnh")
                  }
                />
              );
            })}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="post-card">
      {post.repostOf ? (
        <>
          <div className="repost-header">
            <FaShare />
            <Link to={`/profile/${post.author.username}`}>
              {post.author.username}
            </Link>{" "}
            đã chia sẻ
          </div>
          {post.content && <p className="reposter-comment">{post.content}</p>}
          <div className="original-post-embed">
            {renderPostContent(post.repostOf, false)}
          </div>
        </>
      ) : (
        renderPostContent(post, true)
      )}

      <div className="post-stats">
        <span>{post.reactions.length} cảm xúc</span>
<span>{localCommentCount} bình luận</span>
        <span>{post.repostCount || 0} lượt chia sẻ</span>
      </div>

      <div className="post-actions">
        {/* --- FIX: Nâng cấp nút Thích thành hệ thống Reaction --- */}
        <div className="action-button reaction-container">
          {showReactions && (
            <div className="reaction-popup">
              {Object.values(ReactionTypes).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    handleReact(type as ReactionType);
                    setShowReactions(false); // Ẩn popup sau khi chọn
                  }}
                  className="reaction-icon"
                >
                  {reactionDetails[type as ReactionType].icon}
                </button>
              ))}
            </div>
          )}

          <button
            className="main-action"
            onClick={() => setShowReactions((prev) => !prev)} // Toggle popup
          >
            {currentUserReaction ? (
              <span
                style={{
                  color: reactionDetails[currentUserReaction.type].color,
                }}
              >
                {reactionDetails[currentUserReaction.type].icon}{" "}
                {reactionDetails[currentUserReaction.type].text}
              </span>
            ) : (
              <span>
                <FaRegHeart /> Thích
              </span>
            )}
          </button>
        </div>

        <button
          className="action-button"
          onClick={() => setShowComments(!showComments)}
        >
          <FaRegCommentAlt /> Bình luận
        </button>
        <button
          className="action-button"
          onClick={() => setRepostModalOpen(true)}
          disabled={!!post.repostOf}
        >
          <FaShare /> Chia sẻ
        </button>
      </div>

      {showComments && (
         <CommentSection
    postId={post._id}
    onCommentAdded={() => {
      onCommentAdded(post._id);
      setLocalCommentCount((prev) => prev + 1);
    }}
    onCommentDeleted={() => {
      onCommentDeleted(post._id);
      setLocalCommentCount((prev) => Math.max(0, prev - 1));
    }}
  />
      )}

      {isRepostModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Chia sẻ bài viết</h3>
            <textarea
              placeholder="Thêm bình luận của bạn..."
              value={repostContent}
              onChange={(e) => setRepostContent(e.target.value)}
            />
            <div className="modal-actions">
              <button onClick={() => setRepostModalOpen(false)}>Hủy</button>
              <button onClick={handleRepostSubmit}>Chia sẻ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;
