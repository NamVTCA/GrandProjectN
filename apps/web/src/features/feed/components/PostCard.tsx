import React, { useState, useEffect } from "react";
import type { JSX } from "react";
import { Link } from "react-router-dom";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  FaRegHeart,
  FaHeart,
  FaRegCommentAlt,
  FaShare,
  FaTrash,
  FaThumbsUp,
  FaLaughSquint,
  FaSurprise,
  FaSadTear,
  FaAngry,
  FaFlag,
  FaEdit,
} from "react-icons/fa";
import api from "../../../services/api";
import { useAuth } from "../../auth/AuthContext";
import type { Post, Comment, ReactionType } from "../types/Post";
import { ReactionTypes, PostVisibility } from "../types/Post";
import UserAvatar from "../../../components/common/UserAvatar";
import "./PostCard.scss";

const CommentSection: React.FC<{
  postId: string;
  onCommentAdded: () => void;
  onCommentDeleted: () => void;
}> = ({ postId, onCommentAdded, onCommentDeleted }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const fetchComments = async () => {
    try {
      const response = await api.get(`/posts/${postId}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error("Lỗi khi tải bình luận:", error);
      toast.error("Không thể tải bình luận");
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsLoading(true);
    try {
      await api.post(`/posts/${postId}/comments`, {
        content: newComment,
      });
      await fetchComments();
      setNewComment("");
      onCommentAdded();
      toast.success("Đã thêm bình luận");
    } catch (error) {
      console.error("Lỗi khi gửi bình luận:", error);
      toast.error("Không thể thêm bình luận");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await api.delete(`/posts/comments/${commentId}`);
      await fetchComments();
      onCommentDeleted();
      toast.success("Đã xóa bình luận");
    } catch (error) {
      console.error("Lỗi khi xóa bình luận:", error);
      toast.error("Không thể xóa bình luận");
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
            <UserAvatar
              size={32}
              src={
                comment.author.avatarUrl ||
                "https://placehold.co/32x32/242526/b0b3b8?text=..." ||
                (comment.author as any)?.avatarUrl ||
                (comment.author as any)?.avatar ||
                (comment.author as any)?.avatar_url
              }
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
                toast.warning("Vui lòng nhập lý do báo cáo");
                return;
              }
              onSubmit(reason);
              toast.success("Đã gửi báo cáo thành công");
            }}
          >
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
};

const EditModal: React.FC<{
  post: Post;
  onClose: () => void;
  onSubmit: (content: string, visibility: PostVisibility) => void;
}> = ({ post, onClose, onSubmit }) => {
  const [content, setContent] = useState(post.content || "");
  const [visibility, setVisibility] = useState<PostVisibility>(post.visibility);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Chỉnh sửa bài viết</h3>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Nhập nội dung mới..."
        />
        {!post.group && (
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as PostVisibility)}
          >
            <option value={PostVisibility.PUBLIC}>Công khai</option>
            <option value={PostVisibility.FRIENDS_ONLY}>Chỉ bạn bè</option>
            <option value={PostVisibility.PRIVATE}>Chỉ mình tôi</option>
          </select>
        )}
        <div className="modal-actions">
          <button onClick={onClose}>Hủy</button>
          <button onClick={() => onSubmit(content, visibility)}>Lưu</button>
        </div>
      </div>
    </div>
  );
};

interface PostCardProps {
  post: Post;
  onReact: (postId: string, reaction: ReactionType) => void;
  onRepost: (postId: string, content: string, visibility: PostVisibility) => void;
  onPostDeleted: (postId: string) => void;
  onCommentAdded: (postId: string) => void;
  onCommentDeleted: (postId: string) => void;
  onPostUpdated: (updatedPost: Post) => void;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  onReact,
  onRepost,
  onPostDeleted,
  onCommentAdded,
  onCommentDeleted,
  onPostUpdated,
}) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [isRepostModalOpen, setRepostModalOpen] = useState(false);
  const [repostContent, setRepostContent] = useState("");
  const [visibility, setVisibility] = useState<PostVisibility>(PostVisibility.FRIENDS_ONLY);
  const [showReactions, setShowReactions] = useState(false);
  const [localCommentCount, setLocalCommentCount] = useState(post.commentCount);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isReportModalOpen, setReportModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const isAuthor = user?._id === post.author?._id;
  const isAdmin = user?.globalRole === 'ADMIN';
  const currentUserReaction = user
    ? post.reactions.find((r) => r.user === user._id)
    : null;

  const handleReact = (reaction: ReactionType) => {
    onReact(post._id, reaction);
    toast.success(`Đã bày tỏ cảm xúc ${reactionDetails[reaction].text.toLowerCase()}`);
  };

  const handleRepostSubmit = () => {
    onRepost(post._id, repostContent, visibility);
    setRepostModalOpen(false);
    setRepostContent("");
    toast.success("Đã chia sẻ bài viết");
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/posts/${post._id}`);
      onPostDeleted(post._id);
      setDeleteModalOpen(false);
      toast.success("Đã xóa bài viết");
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Không thể xóa bài viết");
    }
  };

  const handleCommentAddedWrapper = async () => {
    try {
      const response = await api.get(`/posts/${post._id}`);
      setLocalCommentCount(response.data.commentCount);
      onCommentAdded(post._id);
    } catch (error) {
      console.error("Error updating comment count:", error);
    }
  };

  const handleCommentDeletedWrapper = async () => {
    try {
      const response = await api.get(`/posts/${post._id}`);
      setLocalCommentCount(response.data.commentCount);
      onCommentDeleted(post._id);
    } catch (error) {
      console.error("Error updating comment count:", error);
    }
  };

  const handleUpdatePost = async (content: string, visibility: PostVisibility) => {
    try {
      const response = await api.patch(`/posts/${post._id}`, {
        content,
        visibility: post.group ? undefined : visibility,
      });
      onPostUpdated(response.data);
      setEditModalOpen(false);
      toast.success("Đã cập nhật bài viết");
    } catch (error) {
      console.error("Lỗi khi cập nhật bài viết:", error);
      toast.error("Không thể cập nhật bài viết");
    }
  };

  const renderVisibilityIcon = (v: PostVisibility) => {
    if (v === PostVisibility.PRIVATE) return "🔒";
    if (v === PostVisibility.FRIENDS_ONLY) return "👥";
    return "🌍";
  };

  const renderMedia = (mediaUrls: string[]) => {
    if (!mediaUrls || mediaUrls.length === 0) return null;

    const firstMedia = mediaUrls[0];

    return (
      <div className="post-media">
        {firstMedia.endsWith(".mp4") || firstMedia.includes("video") ? (
          <video controls onClick={() => setLightboxIndex(0)}>
            <source src={firstMedia} type="video/mp4" />
            Trình duyệt không hỗ trợ video.
          </video>
        ) : (
          <img
            src={firstMedia}
            alt="Media"
            onClick={() => setLightboxIndex(0)}
            onError={(e) =>
              (e.currentTarget.src =
                "https://placehold.co/600x400/242526/e4e6eb?text=Lỗi+tải+ảnh")
            }
          />
        )}

        {mediaUrls.length > 1 && (
          <div
            className="show-more-overlay"
            onClick={() => setLightboxIndex(0)}
          >
            +{mediaUrls.length - 1}
          </div>
        )}
      </div>
    );
  };

  const renderLightbox = (mediaUrls: string[]) => {
    if (lightboxIndex === null) return null;

    const currentMedia = mediaUrls[lightboxIndex];

    return (
      <div className="lightbox-overlay" onClick={() => setLightboxIndex(null)}>
        <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
          <button className="lightbox-close" onClick={() => setLightboxIndex(null)}>✕</button>
          {currentMedia.endsWith(".mp4") || currentMedia.includes("video") ? (
            <video controls autoPlay>
              <source src={currentMedia} type="video/mp4" />
            </video>
          ) : (
            <img src={currentMedia} alt="Media" />
          )}

          {mediaUrls.length > 1 && (
            <>
              <button
                className="lightbox-prev"
                onClick={() =>
                  setLightboxIndex(
                    (lightboxIndex! - 1 + mediaUrls.length) % mediaUrls.length
                  )
                }
              >
                ‹
              </button>
              <button
                className="lightbox-next"
                onClick={() =>
                  setLightboxIndex((lightboxIndex! + 1) % mediaUrls.length)
                }
              >
                ›
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderOptionsMenu = () => {
    return (
      <div className="options-menu">
        {isAuthor && (
          <>
            <button onClick={() => {
              setEditModalOpen(true);
              setShowOptionsMenu(false);
            }}>
              <FaEdit /> Chỉnh sửa
            </button>
            <button onClick={() => {
              setDeleteModalOpen(true);
              setShowOptionsMenu(false);
            }}>
              <FaTrash /> Xóa
            </button>
          </>
        )}
        {(isAdmin && !isAuthor) && (
          <button onClick={() => {
            setDeleteModalOpen(true);
            setShowOptionsMenu(false);
          }}>
            <FaTrash /> Xóa (Admin)
          </button>
        )}
        {!isAuthor && (
          <button onClick={() => {
            setReportModalOpen(true);
            setShowOptionsMenu(false);
          }}>
            <FaFlag /> Báo cáo
          </button>
        )}
      </div>
    );
  };

  const renderPostContent = (p: Post, isOriginalPost: boolean) => {
    if (!p || !p.author) {
      return <div className="post-embed-error">Không thể tải bài viết.</div>;
    }

    return (
      <>
        <div className="post-header">
          <Link to={`/profile/${p.author.username}`} className="author-info">
            <UserAvatar
              size={48}
              src={
                (p.author as any)?.avatarUrl ||
                (p.author as any)?.avatar ||
                (p.author as any)?.avatar_url
              }
            />
            <div>
              <strong>
                {p.author.username} {renderVisibilityIcon(p.visibility)}
              </strong>
              <span className="timestamp">
                {new Date(p.createdAt).toLocaleString()}
              </span>
            </div>
          </Link>

          <div className="post-options">
            <div
              className="options-trigger"
              onClick={() => setShowOptionsMenu(!showOptionsMenu)}
            >
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
            {showOptionsMenu && renderOptionsMenu()}
          </div>
        </div>

        {p.content && <p className="post-content">{p.content}</p>}
        {p.mediaUrls && p.mediaUrls.length > 0 && (
          <>
            {renderMedia(p.mediaUrls)}
            {renderLightbox(p.mediaUrls)}
          </>
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
              <span
                style={{
                  color:
                    reactionDetails[
                      currentUserReaction.type as keyof typeof reactionDetails
                    ].color,
                }}
              >
                {reactionDetails[
                  currentUserReaction.type as keyof typeof reactionDetails
                ].icon}{" "}
                {reactionDetails[
                  currentUserReaction.type as keyof typeof reactionDetails
                ].text}
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
        >
          <FaShare /> Chia sẻ
        </button>
      </div>

      {showComments && (
        <CommentSection
          postId={post._id}
          onCommentAdded={handleCommentAddedWrapper}
          onCommentDeleted={handleCommentDeletedWrapper}
        />
      )}

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
              <option value={PostVisibility.PUBLIC}>Công khai</option>
              <option value={PostVisibility.FRIENDS_ONLY}>Chỉ bạn bè</option>
              <option value={PostVisibility.PRIVATE}>Chỉ mình tôi</option>
            </select>
            <div className="modal-actions">
              <button onClick={() => setRepostModalOpen(false)}>Hủy</button>
              <button onClick={handleRepostSubmit}>Chia sẻ</button>
            </div>
          </div>
        </div>
      )}

      {isReportModalOpen && (
        <ReportModal
          onClose={() => setReportModalOpen(false)}
          onSubmit={async (reason) => {
            try {
              await api.post("/reports", { type: "POST", targetId: post._id, reason });
              setReportModalOpen(false);
            } catch (error) {
              console.error("Error submitting report:", error);
            }
          }}
        />
      )}

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

      {isEditModalOpen && (
        <EditModal
          post={post}
          onClose={() => setEditModalOpen(false)}
          onSubmit={handleUpdatePost}
        />
      )}
    </div>
  );
};

export default PostCard;
