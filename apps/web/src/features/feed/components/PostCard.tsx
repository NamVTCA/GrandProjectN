
import React, { useState, useEffect, useRef } from "react";
import type { JSX } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
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
  FaReply,
} from "react-icons/fa";
import api from "../../../services/api";
import { useAuth } from "../../auth/AuthContext";
import type { Post, Comment, ReactionType } from "../types/Post";
import { ReactionTypes, PostVisibility } from "../types/Post";
import UserAvatar from "../../../components/common/UserAvatar";
import "./PostCard.scss";

interface ReplyFormProps {
  parentCommentId: string;
  onSubmit: (content: string, parentCommentId: string) => void;
  onCancel: () => void;
  placeholder?: string;
}

const ReplyForm: React.FC<ReplyFormProps> = ({
  parentCommentId,
  onSubmit,
  onCancel,
  placeholder = "Viết trả lời...",
}) => {
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content, parentCommentId);
      setContent("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="reply-form">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        autoFocus
      />
      <div className="reply-actions">
        <button type="submit">Gửi</button>
        <button type="button" onClick={onCancel}>
          Hủy
        </button>
      </div>
    </form>
  );
};

const CommentItem: React.FC<{
  comment: Comment;
  onDelete: (commentId: string) => void;
  onReply: (parentCommentId: string, content: string) => void;
  level?: number;
}> = ({ comment, onDelete, onReply, level = 0 }) => {
  const { user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replies, setReplies] = useState<Comment[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);

  const fetchReplies = async () => {
    if (loadingReplies) return;

    setLoadingReplies(true);
    try {
      const response = await api.get(`/posts/comments/${comment._id}/replies`);
      setReplies(response.data as Comment[]);
    } catch (error) {
      console.error("Lỗi khi tải trả lời:", error);
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleReplySubmit = async (
    content: string,
    parentCommentId: string
  ) => {
    try {
      await api.post(`/posts/comments/${parentCommentId}/replies`, { content });
      toast.success("Đã thêm trả lời");
      setShowReplyForm(false);
      await fetchReplies();
    } catch (error) {
      console.error("Lỗi khi gửi trả lời:", error);
      toast.error("Không thể thêm trả lời");
    }
  };

  return (
    <div
      className={`comment ${level > 0 ? "reply" : ""}`}
      style={{ marginLeft: level * 30 }}
    >
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

        <div className="comment-actions">
          <button
            className="reply-btn"
            onClick={() => setShowReplyForm(!showReplyForm)}
          >
            <FaReply /> Trả lời
          </button>

          {user?._id === comment.author._id && (
            <button
              className="comment-delete-button"
              onClick={() => onDelete(comment._id)}
              title="Xóa bình luận"
            >
              <FaTrash />
            </button>
          )}
        </div>

        {showReplyForm && (
          <ReplyForm
            parentCommentId={comment._id}
            onSubmit={handleReplySubmit}
            onCancel={() => setShowReplyForm(false)}
            placeholder={`Trả lời ${comment.author.username}...`}
          />
        )}

        {comment.replyCount > 0 && replies.length === 0 && (
          <button
            className="view-replies-btn"
            onClick={fetchReplies}
            disabled={loadingReplies}
          >
            {loadingReplies
              ? "Đang tải..."
              : `Xem ${comment.replyCount} trả lời`}
          </button>
        )}

        {replies.length > 0 && (
          <div className="replies">
            {replies.map((reply) => (
              <CommentItem
                key={reply._id}
                comment={reply}
                onDelete={onDelete}
                onReply={onReply}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

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
      setComments(response.data as Comment[]);
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

  const handleReplyComment = async (
    parentCommentId: string,
    content: string
  ) => {
    try {
      await api.post(`/posts/comments/${parentCommentId}/replies`, { content });
      await fetchComments();
      onCommentAdded();
      toast.success("Đã thêm trả lời");
    } catch (error) {
      console.error("Lỗi khi gửi trả lời:", error);
      toast.error("Không thể thêm trả lời");
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
          <CommentItem
            key={comment._id}
            comment={comment}
            onDelete={handleDeleteComment}
            onReply={handleReplyComment}
          />
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
  postId?: string;
  userId?: string;
}> = ({ onClose, onSubmit, postId, userId }) => {
  const [reason, setReason] = useState("");
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content report-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>🚩 Gửi báo cáo</h3>
        {postId && (
          <p className="report-link">
            <Link to={`/posts/${postId}`} target="_blank">
              Xem bài viết được báo cáo
            </Link>
          </p>
        )}
        {userId && (
          <p className="report-link">
            <Link to={`/profile/${userId}`} target="_blank">
              Xem hồ sơ người dùng
            </Link>
          </p>
        )}
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
  onSubmit: (
    content: string,
    visibility: PostVisibility,
    mediaUrls: string[]
  ) => void;
}> = ({ post, onClose, onSubmit }) => {
  const [content, setContent] = useState(post.content || "");
  const [visibility, setVisibility] = useState<PostVisibility>(post.visibility);
  const [mediaUrls, setMediaUrls] = useState<string[]>(post.mediaUrls || []);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  // Xóa media cũ
  const handleRemoveMedia = (index: number) => {
    const updated = [...mediaUrls];
    updated.splice(index, 1);
    setMediaUrls(updated);
  };

  // Chọn file mới
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewFiles([...newFiles, ...Array.from(e.target.files)]);
    }
  };

  // Upload & submit
  const handleSave = async () => {
    try {
      let uploadedUrls: string[] = [];

      if (newFiles.length > 0) {
        const formData = new FormData();
        newFiles.forEach((file) => formData.append("files", file));

        const res = await api.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        uploadedUrls = (res.data as { urls: string[] }).urls;
      }

      onSubmit(content, visibility, [...mediaUrls, ...uploadedUrls]);
    } catch (err) {
      console.error("Upload media error:", err);
      toast.error("Không thể tải lên media");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Chỉnh sửa bài viết</h3>

        {/* Nội dung */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Nhập nội dung mới..."
        />

        {/* Chế độ hiển thị */}
        {!post.group && (
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as PostVisibility)}
          >
            <option value={PostVisibility.PUBLIC}>Công khai 🌍</option>
            <option value={PostVisibility.FRIENDS_ONLY}>Chỉ bạn bè 👥</option>
            <option value={PostVisibility.PRIVATE}>Chỉ mình tôi 🔒</option>
          </select>
        )}

        {/* Media cũ */}
        <div className="edit-media-preview">
          {mediaUrls.map((url, idx) => (
            <div key={idx} className="media-item">
              {url.endsWith(".mp4") ? (
                <video
                  src={url}
                  controls
                  onError={(e) => {
                    (e.currentTarget as HTMLVideoElement).poster =
                      "https://placehold.co/150x100/242526/e4e6eb?text=Lỗi+video";
                  }}
                />
              ) : (
                <img
                  src={url}
                  alt={`media-${idx}`}
                  onError={(e) =>
                    (e.currentTarget.src =
                      "https://placehold.co/150x100/242526/e4e6eb?text=Lỗi+ảnh")
                  }
                />
              )}
              <button
                type="button"
                className="remove-btn"
                onClick={() => handleRemoveMedia(idx)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Upload file mới */}
        <div className="upload-section">
          <label htmlFor="file-upload" className="upload-btn">
            📷 Thêm ảnh/video
          </label>
          <input
            id="file-upload"
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </div>

        {/* Preview file mới */}
        {newFiles.length > 0 && (
          <div className="new-media-preview">
            {newFiles.map((file, idx) => {
              const url = URL.createObjectURL(file);
              return (
                <div key={idx} className="media-item">
                  {file.type.startsWith("video/") ? (
                    <video
                      src={url}
                      controls
                      onError={(e) => {
                        (e.currentTarget as HTMLVideoElement).poster =
                          "https://placehold.co/150x100/242526/e4e6eb?text=Lỗi+video";
                      }}
                    />
                  ) : (
                    <img
                      src={url}
                      alt={`new-${idx}`}
                      onError={(e) =>
                        (e.currentTarget.src =
                          "https://placehold.co/150x100/242526/e4e6eb?text=Lỗi+ảnh")
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Nút hành động */}
        <div className="modal-actions">
          <button onClick={onClose}>Hủy</button>
          <button onClick={handleSave}>Lưu</button>
        </div>
      </div>
    </div>
  );
};


interface PostCardProps {
  post: Post;
  onReact: (postId: string, reaction: ReactionType) => void;
  onRepost: (
    postId: string,
    content: string,
    visibility: PostVisibility
  ) => void;
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
  const [visibility, setVisibility] = useState<PostVisibility>(
    PostVisibility.FRIENDS_ONLY
  );
  const [showReactions, setShowReactions] = useState(false);
  const [localCommentCount, setLocalCommentCount] = useState(post.commentCount);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isReportModalOpen, setReportModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [reactionHoverTimeout, setReactionHoverTimeout] = useState<
    number | null
  >(null);

  const isAuthor = user?._id === post.author?._id;
  const isAdmin = user?.globalRole === "ADMIN";
  const currentUserReaction = user
    ? post.reactions.find((r) => r.user === user._id)
    : null;

  const handleReact = (reaction: ReactionType) => {
    onReact(post._id, reaction);
    toast.success(
      `Đã bày tỏ cảm xúc ${reactionDetails[reaction].text.toLowerCase()}`
    );
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
      const response = await api.get(`/posts/${post._id}/comment-count`);
      setLocalCommentCount(
        (response.data as { commentCount: number }).commentCount
      );
      onCommentAdded(post._id);
    } catch (error) {
      console.error("Error updating comment count:", error);
    }
  };

  const handleCommentDeletedWrapper = async () => {
    try {
      setLocalCommentCount((prev) => Math.max(0, prev - 1));
      onCommentDeleted(post._id);
    } catch (error) {
      console.error("Error updating comment count:", error);
    }
  };

  const handleUpdatePost = async (
    content: string,
    visibility: PostVisibility,
    mediaUrls: string[]
  ) => {
    try {
      const response = await api.patch(`/posts/${post._id}`, {
        content,
        visibility: post.group ? undefined : visibility,
        mediaUrls, // ✅ gửi luôn media đã chỉnh sửa
      });
      onPostUpdated(response.data as Post);
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
  const [activeIndex, setActiveIndex] = useState(0);

const renderMedia = (mediaUrls: string[]) => {
  if (!mediaUrls || mediaUrls.length === 0) return null;

  // Giữ index không vượt quá mảng
  const safeIndex = Math.min(activeIndex, mediaUrls.length - 1);
  const current = mediaUrls[safeIndex];
  if (!current) return null;

  const isVideo = current.endsWith(".mp4") || current.includes("video");

  return (
    <div className="post-media-carousel">
      {isVideo ? (
        <video
          src={current}
          controls
          onClick={() => setLightboxIndex(safeIndex)}
        />
      ) : (
        <img
          src={current}
          alt={`media-${safeIndex}`}
          onClick={() => setLightboxIndex(safeIndex)}
        />
      )}

      {mediaUrls.length > 1 && (
        <>
          <button
            className="nav prev"
            onClick={(e) => {
              e.stopPropagation();
              setActiveIndex((prev) =>
                prev === 0 ? mediaUrls.length - 1 : prev - 1
              );
            }}
          >
            ‹
          </button>
          <button
            className="nav next"
            onClick={(e) => {
              e.stopPropagation();
              setActiveIndex((prev) => (prev + 1) % mediaUrls.length);
            }}
          >
            ›
          </button>
        </>
      )}
    </div>
  );
};



const renderLightbox = (mediaUrls: string[]) => {
  if (lightboxIndex === null) return null;
  const currentMedia = mediaUrls[lightboxIndex];
  const isVideo = currentMedia.endsWith(".mp4") || currentMedia.includes("video");

  return (
    <div className="lightbox-overlay" onClick={() => setLightboxIndex(null)}>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <button className="lightbox-close" onClick={() => setLightboxIndex(null)}>✕</button>

        {isVideo ? (
          <video src={currentMedia} controls autoPlay />
        ) : (
          <img src={currentMedia} alt={`media-${lightboxIndex}`} />
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
            <button
              onClick={() => {
                setEditModalOpen(true);
                setShowOptionsMenu(false);
              }}
            >
              <FaEdit /> Chỉnh sửa
            </button>
            <button
              onClick={() => {
                setDeleteModalOpen(true);
                setShowOptionsMenu(false);
              }}
            >
              <FaTrash /> Xóa
            </button>
          </>
        )}
        {isAdmin && !isAuthor && (
          <button
            onClick={() => {
              setDeleteModalOpen(true);
              setShowOptionsMenu(false);
            }}
          >
            <FaTrash /> Xóa (Admin)
          </button>
        )}
        {!isAuthor && (
          <button
            onClick={() => {
              setReportModalOpen(true);
              setShowOptionsMenu(false);
            }}
          >
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
        <div className="reaction-container">
          <button
            className="action-button"
            onMouseEnter={() => {
              // Clear any existing timeout
              if (reactionHoverTimeout) {
                window.clearTimeout(reactionHoverTimeout);
                setReactionHoverTimeout(null);
              }
              // Show reactions after a short delay
              const timeout = window.setTimeout(() => {
                setShowReactions(true);
              }, 300);
              setReactionHoverTimeout(timeout);
            }}
            onMouseLeave={() => {
              // Hide reactions after a short delay
              if (reactionHoverTimeout) {
                window.clearTimeout(reactionHoverTimeout);
              }
              const timeout = window.setTimeout(() => {
                setShowReactions(false);
              }, 300);
              setReactionHoverTimeout(timeout);
            }}
            onClick={() => {
              if (currentUserReaction) {
                handleReact(currentUserReaction.type as ReactionType);
              } else {
                handleReact("LIKE");
              }
            }}
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
                {
                  reactionDetails[
                    currentUserReaction.type as keyof typeof reactionDetails
                  ].icon
                }{" "}
                {
                  reactionDetails[
                    currentUserReaction.type as keyof typeof reactionDetails
                  ].text
                }
              </span>
            ) : (
              <span>
                <FaRegHeart /> Thích
              </span>
            )}
          </button>

          {showReactions && (
            <div
              className="reaction-popup"
              onMouseEnter={() => {
                // Clear timeout when mouse enters the popup
                if (reactionHoverTimeout) {
                  window.clearTimeout(reactionHoverTimeout);
                  setReactionHoverTimeout(null);
                }
                setShowReactions(true);
              }}
              onMouseLeave={() => {
                // Hide reactions after a short delay
                const timeout = window.setTimeout(() => {
                  setShowReactions(false);
                }, 300);
                setReactionHoverTimeout(timeout);
              }}
            >
              {Object.values(ReactionTypes).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    handleReact(type as ReactionType);
                    setShowReactions(false);
                  }}
                  className={`reaction-icon ${type.toLowerCase()}`}
                  title={reactionDetails[type as ReactionType].text}
                >
                  {reactionDetails[type as ReactionType].icon}
                </button>
              ))}
            </div>
          )}
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
              await api.post("/reports", {
                type: "POST",
                targetId: post._id,
                reason,
              });
              setReportModalOpen(false);
            } catch (error) {
              console.error("Error submitting report:", error);
            }
          }}
          postId={post._id}
        />
      )}

      {isDeleteModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setDeleteModalOpen(false)}
        >
          <div
            className="modal-content confirm-delete-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Xác nhận xóa</h3>
            <p>
              Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không
              thể hoàn tác.
            </p>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setDeleteModalOpen(false)}
              >
                Hủy
              </button>
              <button className="btn-confirm-delete" onClick={confirmDelete}>
                Xóa
              </button>
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
