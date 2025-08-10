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
import type { Post, Comment, ReactionType, PostVisibility } from "../types/Post";
import { ReactionTypes } from "../types/Post";
import "./PostCard.scss";

// --- Component Comment ---
const CommentSection: React.FC<{
  postId: string;
  onCommentAdded: () => void;
  onCommentDeleted: () => void;
}> = ({ postId, onCommentAdded, onCommentDeleted }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

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
                comment.author.avatarUrl ||
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

// --- Reaction Icons Map ---
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

// --- ReportModal ---
const ReportModal: React.FC<{
  onClose: () => void;
  onSubmit: (reason: string) => void;
}> = ({ onClose, onSubmit }) => {
  const [reason, setReason] = useState("");
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content report-modal" onClick={(e) => e.stopPropagation()}>
        <h3>🚩 Gửi báo cáo</h3>
        <textarea
          placeholder="Nhập lý do bạn muốn báo cáo..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="modal-actions">
          <button onClick={onClose}>Hủy</button>
          <button
            onClick={() => {
              if (!reason.trim()) {
                alert("Vui lòng nhập lý do báo cáo.");
                return;
              }
              onSubmit(reason);
            }}
          >
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main PostCard Component ---
interface PostCardProps {
  post: Post;
  onReact: (postId: string, reaction: ReactionType) => void;
  onRepost: (postId: string, content: string, visibility: PostVisibility) => void;
  onPostDeleted: (postId: string) => void;
  onCommentAdded: (postId: string) => void;
  onCommentDeleted: (postId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  onReact,
  onRepost,
  onPostDeleted,
  onCommentAdded,
  onCommentDeleted,
}) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [isRepostModalOpen, setRepostModalOpen] = useState(false);
  const [repostContent, setRepostContent] = useState("");
  const [visibility, setVisibility] = useState<PostVisibility>("FRIENDS_ONLY");
  const [showReactions, setShowReactions] = useState(false);
  const [localCommentCount, setLocalCommentCount] = useState(post.commentCount);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isReportModalOpen, setReportModalOpen] = useState(false);

  useEffect(() => {
    setLocalCommentCount(post.commentCount);
  }, [post.commentCount]);

  const isAuthor = user?._id === post.author?._id;
  const currentUserReaction = user
    ? post.reactions.find((r) => r.user === user._id)
    : null;

  const handleReact = (reaction: ReactionType) => {
    onReact(post._id, reaction);
  };

  const handleRepostSubmit = () => {
    onRepost(post._id, repostContent, visibility);
    setRepostModalOpen(false);
    setRepostContent("");
  };

  const confirmDelete = () => {
    onPostDeleted(post._id);
    setDeleteModalOpen(false);
  };

  const renderVisibilityIcon = (v: PostVisibility) => {
    if (v === "PRIVATE") return <span title="Chỉ mình tôi">🔒</span>;
    if (v === "FRIENDS_ONLY") return <span title="Chỉ bạn bè">👥</span>;
    return <span title="Công khai">🌍</span>;
  };

  const renderPostContent = (p: Post, isOriginalPost: boolean) => {
    if (!p || !p.author) {
      return <div className="post-embed-error">Không thể tải bài viết.</div>;
    }

    return (
      <>
        <div className="post-header">
          <Link to={`/profile/${p.author.username}`} className="author-info">
            <img
              src={
                p.author.avatarUrl ||
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

          {/* Menu Xóa hoặc Báo cáo */}
          <div className="post-options">
            <FaEllipsisH />
            <div className="options-menu">
              {isAuthor && isOriginalPost && (
                <button onClick={() => setDeleteModalOpen(true)}>
                  <FaTrash /> Xóa
                </button>
              )}
              {!isAuthor && (
                <button onClick={() => setReportModalOpen(true)}>
                  🚩 Báo cáo
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="post-visibility">{renderVisibilityIcon(p.visibility)}</div>
        {p.content && <p className="post-content">{p.content}</p>}
        {p.mediaUrls && p.mediaUrls.length > 0 && (
          <div className="post-media">
            {p.mediaUrls.map((url) =>
              url.endsWith(".mp4") || url.includes("video") ? (
                <video key={url} controls>
                  <source src={url} type="video/mp4" />
                  Trình duyệt không hỗ trợ video.
                </video>
              ) : (
                <img
                  key={url}
                  src={url}
                  alt="Media"
                  onError={(e) =>
                    (e.currentTarget.src =
                      "https://placehold.co/600x400/242526/e4e6eb?text=Lỗi+tải+ảnh")
                  }
                />
              )
            )}
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
        <span>{post.repostCount || 0} chia sẻ</span>
      </div>

      <div className="post-actions">
        <div className="action-button reaction-container">
          {showReactions && (
            <div className="reaction-popup">
              {Object.values(ReactionTypes).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    handleReact(type as ReactionType);
                    setShowReactions(false);
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
            onClick={() => setShowReactions((prev) => !prev)}
          >
            {currentUserReaction ? (
              <span style={{ color: reactionDetails[currentUserReaction.type].color }}>
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

        <button className="action-button" onClick={() => setShowComments(!showComments)}>
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

      {/* Modal chia sẻ */}
      {isRepostModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Chia sẻ bài viết</h3>
            <textarea
              placeholder="Thêm bình luận..."
              value={repostContent}
              onChange={(e) => setRepostContent(e.target.value)}
            />
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as PostVisibility)}
            >
              <option value="PUBLIC">Công khai</option>
              <option value="FRIENDS_ONLY">Chỉ bạn bè</option>
              <option value="PRIVATE">Chỉ mình tôi</option>
            </select>
            <div className="modal-actions">
              <button onClick={() => setRepostModalOpen(false)}>Hủy</button>
              <button onClick={handleRepostSubmit}>Chia sẻ</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal báo cáo */}
      {isReportModalOpen && (
        <ReportModal
          onClose={() => setReportModalOpen(false)}
          onSubmit={async (reason) => {
            await api.post("/reports", { type: "POST", targetId: post._id, reason });
            alert("✅ Cảm ơn bạn đã báo cáo bài viết này.");
            setReportModalOpen(false);
          }}
        />
      )}

      {/* Modal xác nhận xóa */}
      {isDeleteModalOpen && (
        <div className="modal-overlay" onClick={() => setDeleteModalOpen(false)}>
          <div className="modal-content confirm-delete-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Xác nhận xóa</h3>
            <p>Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác.</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setDeleteModalOpen(false)}>Hủy</button>
              <button className="btn-confirm-delete" onClick={confirmDelete}>Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;
