import React, { useState, useEffect } from "react";
import type { JSX } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  Linking,
  Platform,
} from "react-native";
import { useNavigation } from '@react-navigation/native';

import api from "../../../services/api";
import { useAuth } from "../../auth/AuthContext";
import type { Post, Comment, ReactionType } from "../types/Post";
import { ReactionTypes, PostVisibility } from "../types/Post";
import UserAvatar from "../../../components/common/UserAvatar";
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from "../../../navigation/AppNavigator";
import Toast from "react-native-toast-message";

// Định nghĩa extended parameter list để bao gồm EditProfile
type ExtendedRootStackParamList = RootStackParamList & {
  EditProfile: { username: string };
  Profile: { username: string };
};

type PostNavigationProp = NativeStackNavigationProp<ExtendedRootStackParamList>;

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
  placeholder = "Viết trả lời..."
}) => {
  const [content, setContent] = useState("");

  const handleSubmit = () => {
    if (content.trim()) {
      onSubmit(content, parentCommentId);
      setContent("");
    }
  };

  return (
    <View style={styles.replyForm}>
      <TextInput
        style={styles.replyInput}
        value={content}
        onChangeText={setContent}
        placeholder={placeholder}
        autoFocus
      />
      <View style={styles.replyActions}>
        <TouchableOpacity style={styles.replyButton} onPress={handleSubmit}>
          <Text>Gửi</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.replyCancelButton} onPress={onCancel}>
          <Text>Hủy</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  const navigation = useNavigation<PostNavigationProp>();

  const fetchReplies = async () => {
    if (loadingReplies) return;
    
    setLoadingReplies(true);
    try {
      const response = await api.get(`/posts/comments/${comment._id}/replies`);
      setReplies(response.data);
    } catch (error) {
      console.error("Lỗi khi tải trả lời:", error);
    } finally {
      setLoadingReplies(false);
    }
  };

const handleReplySubmit = async (content: string, parentCommentId: string) => {
  try {
    await api.post(`/posts/comments/${parentCommentId}/replies`, { content });
    Toast.show({
      type: "success",
      text1: "Đã thêm trả lời",
    });
    setShowReplyForm(false);
    await fetchReplies();
  } catch (error) {
    console.error("Lỗi khi gửi trả lời:", error);
    Toast.show({
      type: "error",
      text1: "Không thể thêm trả lời",
    });
  }
};


  return (
    <View style={[styles.comment, level > 0 && styles.commentReply, { marginLeft: level * 30 }]}>
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
      <View style={styles.commentContent}>
   <TouchableOpacity 
  onPress={() => navigation.navigate('EditProfile', { username: comment.author.username })}
>
  <Text style={styles.commentAuthor}>{comment.author.username}</Text>
</TouchableOpacity>


        <Text style={styles.commentText}>{comment.content}</Text>
        
        <View style={styles.commentActions}>
          <TouchableOpacity
            style={styles.replyButton}
            onPress={() => setShowReplyForm(!showReplyForm)}
          >
            <Text style={styles.replyButtonText}>Trả lời</Text>
          </TouchableOpacity>
          
          {user?._id === comment.author._id && (
            <TouchableOpacity
              style={styles.commentDeleteButton}
              onPress={() => onDelete(comment._id)}
            >
              <Text style={styles.commentDeleteText}>Xóa</Text>
            </TouchableOpacity>
          )}
        </View>

        {showReplyForm && (
          <ReplyForm
            parentCommentId={comment._id}
            onSubmit={handleReplySubmit}
            onCancel={() => setShowReplyForm(false)}
            placeholder={`Trả lời ${comment.author.username}...`}
          />
        )}

    {(comment.replyCount ?? 0) > 0 && replies.length === 0 && (
  <TouchableOpacity 
    style={styles.viewRepliesBtn}
    onPress={fetchReplies}
    disabled={loadingReplies}
  >
    <Text style={styles.viewRepliesText}>
      {loadingReplies ? 'Đang tải...' : `Xem ${comment.replyCount ?? 0} trả lời`}
    </Text>
  </TouchableOpacity>
)}


        {replies.length > 0 && (
          <View style={styles.replies}>
            {replies.map((reply) => (
              <CommentItem
                key={reply._id}
                comment={reply}
                onDelete={onDelete}
                onReply={onReply}
                level={level + 1}
              />
            ))}
          </View>
        )}
      </View>
    </View>
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
      setComments(response.data);
    } catch (error) {
      console.error("Lỗi khi tải bình luận:", error);
       Toast.show({
      type: "error",
      text1: "Không thể tải bình luận",
    });
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

const handleCommentSubmit = async () => {
  if (!newComment.trim()) return;
  setIsLoading(true);
  try {
    await api.post(`/posts/${postId}/comments`, {
      content: newComment,
    });
    await fetchComments();
    setNewComment("");
    onCommentAdded();
    Toast.show({
      type: "success",
      text1: "Đã thêm bình luận",
    });
  } catch (error) {
    console.error("Lỗi khi gửi bình luận:", error);
    Toast.show({
      type: "error",
      text1: "Không thể thêm bình luận",
    });
  } finally {
    setIsLoading(false);
  }
};


  const handleReplyComment = async (parentCommentId: string, content: string) => {
  try {
    await api.post(`/posts/comments/${parentCommentId}/replies`, { content });
    await fetchComments();
    onCommentAdded();
    Toast.show({
      type: "success",
      text1: "Đã thêm trả lời",
    });
  } catch (error) {
    console.error("Lỗi khi gửi trả lời:", error);
    Toast.show({
      type: "error",
      text1: "Không thể thêm trả lời",
    });
  }
};

const handleDeleteComment = async (commentId: string) => {
  try {
    await api.delete(`/posts/comments/${commentId}`);
    await fetchComments();
    onCommentDeleted();
    Toast.show({
      type: "success",
      text1: "Đã xóa bình luận",
    });
  } catch (error) {
    console.error("Lỗi khi xóa bình luận:", error);
    Toast.show({
      type: "error",
      text1: "Không thể xóa bình luận",
    });
  }
};

  return (
    <View style={styles.commentSection}>
      <View style={styles.commentForm}>
        <TextInput
          style={styles.commentInput}
          value={newComment}
          onChangeText={setNewComment}
          placeholder="Viết bình luận..."
          editable={!isLoading}
        />
        <TouchableOpacity 
          style={[styles.commentSubmitButton, (!newComment.trim() || isLoading) && styles.commentSubmitButtonDisabled]} 
          onPress={handleCommentSubmit}
          disabled={!newComment.trim() || isLoading}
        >
          <Text style={styles.commentSubmitText}>Gửi</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.commentList}>
        {comments.map((comment) => (
          <CommentItem
            key={comment._id}
            comment={comment}
            onDelete={handleDeleteComment}
            onReply={handleReplyComment}
          />
        ))}
      </View>
    </View>
  );
};

const reactionDetails: {
  [key in ReactionType]: { icon: JSX.Element; text: string; color: string };
} = {
  LIKE: { icon: <Text>👍</Text>, text: "Thích", color: "#3ea6ff" },
  LOVE: { icon: <Text>❤️</Text>, text: "Yêu thích", color: "#ff4d6d" },
  HAHA: { icon: <Text>😄</Text>, text: "Haha", color: "#f7b928" },
  WOW: { icon: <Text>😲</Text>, text: "Wow", color: "#f7b928" },
  SAD: { icon: <Text>😢</Text>, text: "Buồn", color: "#f7b928" },
  ANGRY: { icon: <Text>😠</Text>, text: "Phẫn nộ", color: "#e0245e" },
};

const ReportModal: React.FC<{
  onClose: () => void;
  onSubmit: (reason: string) => void;
  postId?: string;
  userId?: string;
}> = ({ onClose, onSubmit, postId, userId }) => {
  const [reason, setReason] = useState("");
  const navigation = useNavigation<PostNavigationProp>();

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.modalOverlay} onTouchStart={onClose}>
        <View style={[styles.modalContent, styles.reportModal]} onTouchStart={(e) => e.stopPropagation()}>
          <Text style={styles.modalTitle}>🚩 Gửi báo cáo</Text>
          <TextInput
            style={styles.reportTextarea}
            placeholder="Nhập lý do bạn muốn báo cáo..."
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={4}
          />
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalButton} onPress={onClose}>
              <Text>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButtonPrimary}
              onPress={() => {
                if (!reason.trim()) {
                   Toast.show({
      type: "error",
      text1: "Vui lòng nhập lý do báo cáo",
    });
                  return;
                }
                onSubmit(reason);
                 Toast.show({
      type: "success",
      text1: "Đã gửi báo cáo thành công",
    });
              }}
            >
              <Text style={styles.modalButtonPrimaryText}>Gửi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
    <Modal visible transparent animationType="fade">
      <View style={styles.modalOverlay} onTouchStart={onClose}>
        <View style={styles.modalContent} onTouchStart={(e) => e.stopPropagation()}>
          <Text style={styles.modalTitle}>Chỉnh sửa bài viết</Text>
          <TextInput
            style={styles.editTextarea}
            value={content}
            onChangeText={setContent}
            placeholder="Nhập nội dung mới..."
            multiline
            numberOfLines={4}
          />
          {!post.group && (
            <View style={styles.visibilitySelectContainer}>
              <TouchableOpacity 
                style={[
                  styles.visibilityOption, 
                  visibility === PostVisibility.PUBLIC && styles.visibilityOptionSelected
                ]}
                onPress={() => setVisibility(PostVisibility.PUBLIC)}
              >
                <Text style={styles.visibilityOptionText}>Công khai</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.visibilityOption, 
                  visibility === PostVisibility.FRIENDS_ONLY && styles.visibilityOptionSelected
                ]}
                onPress={() => setVisibility(PostVisibility.FRIENDS_ONLY)}
              >
                <Text style={styles.visibilityOptionText}>Chỉ bạn bè</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.visibilityOption, 
                  visibility === PostVisibility.PRIVATE && styles.visibilityOptionSelected
                ]}
                onPress={() => setVisibility(PostVisibility.PRIVATE)}
              >
                <Text style={styles.visibilityOptionText}>Chỉ mình tôi</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalButton} onPress={onClose}>
              <Text>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.modalButtonPrimary} 
              onPress={() => onSubmit(content, visibility)}
            >
              <Text style={styles.modalButtonPrimaryText}>Lưu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const navigation = useNavigation<PostNavigationProp>();

  const isAuthor = user?._id === post.author?._id;
  const isAdmin = user?.globalRole === 'ADMIN';
  const currentUserReaction = user
    ? post.reactions.find((r) => r.user === user._id)
    : null;


const handleReact = (reaction: ReactionType) => {
  onReact(post._id, reaction);
  Toast.show({
    type: "success",
    text1: `Đã bày tỏ cảm xúc ${reactionDetails[reaction].text.toLowerCase()}`,
  });
};


const handleRepostSubmit = () => {
  onRepost(post._id, repostContent, visibility);
  setRepostModalOpen(false);
  setRepostContent("");
  Toast.show({
    type: "success",
    text1: "Đã chia sẻ bài viết",
  });
};

const confirmDelete = async () => {
  try {
    await api.delete(`/posts/${post._id}`);
    onPostDeleted(post._id);
    setDeleteModalOpen(false);
    Toast.show({
      type: "success",
      text1: "Đã xóa bài viết",
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    Toast.show({
      type: "error",
      text1: "Không thể xóa bài viết",
    });
  }
};


  const handleCommentAddedWrapper = async () => {
    try {
      const response = await api.get(`/posts/${post._id}/comment-count`);
      setLocalCommentCount(response.data.commentCount);
      onCommentAdded(post._id);
    } catch (error) {
      console.error("Error updating comment count:", error);
    }
  };

  const handleCommentDeletedWrapper = async () => {
    try {
      setLocalCommentCount(prev => Math.max(0, prev - 1));
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
    Toast.show({
      type: "success",
      text1: "Đã cập nhật bài viết",
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật bài viết:", error);
    Toast.show({
      type: "error",
      text1: "Không thể cập nhật bài viết",
    });
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
      <View style={styles.postMedia}>
        {firstMedia.includes("video") ? (
          <Text>Video preview would go here</Text>
        ) : (
          <Image
            source={{ uri: firstMedia }}
            style={styles.mediaImage}
            resizeMode="cover"
            onError={() => console.log("Error loading image")}
          />
        )}

        {mediaUrls.length > 1 && (
          <TouchableOpacity 
            style={styles.showMoreOverlay}
            onPress={() => setLightboxIndex(0)}
          >
            <Text style={styles.showMoreText}>+{mediaUrls.length - 1}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderLightbox = (mediaUrls: string[]) => {
    if (lightboxIndex === null) return null;

    return (
      <Modal visible transparent animationType="fade">
        <View style={styles.lightboxOverlay} onTouchStart={() => setLightboxIndex(null)}>
          <View style={styles.lightboxContent} onTouchStart={(e) => e.stopPropagation()}>
            <TouchableOpacity 
              style={styles.lightboxClose}
              onPress={() => setLightboxIndex(null)}
            >
              <Text style={styles.lightboxCloseText}>✕</Text>
            </TouchableOpacity>
            <Image
              source={{ uri: mediaUrls[lightboxIndex] }}
              style={styles.lightboxImage}
              resizeMode="contain"
            />
          </View>
        </View>
      </Modal>
    );
  };

  const renderOptionsMenu = () => {
    return (
      <View style={styles.optionsMenu}>
        {isAuthor && (
          <>
            <TouchableOpacity 
              style={styles.optionsMenuItem}
              onPress={() => {
                setEditModalOpen(true);
                setShowOptionsMenu(false);
              }}
            >
              <Text style={styles.optionsMenuText}>Chỉnh sửa</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.optionsMenuItem}
              onPress={() => {
                setDeleteModalOpen(true);
                setShowOptionsMenu(false);
              }}
            >
              <Text style={styles.optionsMenuText}>Xóa</Text>
            </TouchableOpacity>
          </>
        )}
        {(isAdmin && !isAuthor) && (
          <TouchableOpacity 
            style={styles.optionsMenuItem}
            onPress={() => {
              setDeleteModalOpen(true);
              setShowOptionsMenu(false);
            }}
          >
            <Text style={styles.optionsMenuText}>Xóa (Admin)</Text>
          </TouchableOpacity>
        )}
        {!isAuthor && (
          <TouchableOpacity 
            style={styles.optionsMenuItem}
            onPress={() => {
              setReportModalOpen(true);
              setShowOptionsMenu(false);
            }}
          >
            <Text style={styles.optionsMenuText}>Báo cáo</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderPostContent = (p: Post, isOriginalPost: boolean) => {
    if (!p || !p.author) {
      return <Text style={styles.postEmbedError}>Không thể tải bài viết.</Text>;
    }

    return (
      <>
        <View style={styles.postHeader}>
          <TouchableOpacity 
            style={styles.authorInfo}
            onPress={() => navigation.navigate('Profile', { username: p.author.username })}
          >
            <UserAvatar
              size={48}
              src={
                (p.author as any)?.avatarUrl ||
                (p.author as any)?.avatar ||
                (p.author as any)?.avatar_url
              }
            />
            <View>
              <Text style={styles.authorName}>
                {p.author.username} {renderVisibilityIcon(p.visibility)}
              </Text>
              <Text style={styles.timestamp}>
                {new Date(p.createdAt).toLocaleString()}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.postOptions}>
            <TouchableOpacity
              style={styles.optionsTrigger}
              onPress={() => setShowOptionsMenu(!showOptionsMenu)}
            >
              <Text style={styles.optionsDots}>•••</Text>
            </TouchableOpacity>
            {showOptionsMenu && renderOptionsMenu()}
          </View>
        </View>

        {p.content && <Text style={styles.postContent}>{p.content}</Text>}
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
    <View style={styles.postCard}>
      {post.repostOf ? (
        <>
          <View style={styles.repostHeader}>
      <Text style={styles.repostText}>
        <Text>🔁 </Text>
        <Text
          style={styles.repostAuthor}
          onPress={() => navigation.navigate('Profile', { username: post.author.username })}
        >
          {post.author.username}
        </Text>
        {" "}đã chia sẻ
      </Text>
    </View>
          {post.content && <Text style={styles.reposterComment}>{post.content}</Text>}
          <View style={styles.originalPostEmbed}>
            {renderPostContent(post.repostOf, false)}
          </View>
        </>
      ) : (
        renderPostContent(post, true)
      )}

      <View style={styles.postStats}>
        <Text style={styles.postStat}>{post.reactions.length} cảm xúc</Text>
        <Text style={styles.postStat}>{localCommentCount} bình luận</Text>
        <Text style={styles.postStat}>{post.repostCount || 0} chia sẻ</Text>
      </View>

      <View style={styles.postActions}>
        <View style={styles.reactionContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPressIn={() => {
              // Show reactions on press in
              setShowReactions(true);
            }}
            onPressOut={() => {
              // Hide reactions after a delay
              setTimeout(() => {
                setShowReactions(false);
              }, 300);
            }}
            onPress={() => {
              if (currentUserReaction) {
                handleReact(currentUserReaction.type as ReactionType);
              } else {
                handleReact('LIKE');
              }
            }}
          >
            <Text style={[
              styles.actionButtonText,
              currentUserReaction && {
                color: reactionDetails[currentUserReaction.type as ReactionType].color
              }
            ]}>
              {currentUserReaction ? (
                <>
                  {reactionDetails[currentUserReaction.type as ReactionType].icon}{" "}
                  {reactionDetails[currentUserReaction.type as ReactionType].text}
                </>
              ) : (
                "❤️ Thích"
              )}
            </Text>
          </TouchableOpacity>
          
          {showReactions && (
            <View 
              style={styles.reactionPopup}
              onTouchStart={() => setShowReactions(true)}
              onTouchEnd={() => setTimeout(() => setShowReactions(false), 300)}
            >
              {Object.values(ReactionTypes).map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => {
                    handleReact(type as ReactionType);
                    setShowReactions(false);
                  }}
                  style={styles.reactionIcon}
                >
                  <Text style={styles.reactionEmoji}>
                    {reactionDetails[type as ReactionType].icon}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowComments(!showComments)}
        >
          <Text style={styles.actionButtonText}>💬 Bình luận</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setRepostModalOpen(true)}
        >
          <Text style={styles.actionButtonText}>🔁 Chia sẻ</Text>
        </TouchableOpacity>
      </View>

      {showComments && (
        <CommentSection
          postId={post._id}
          onCommentAdded={handleCommentAddedWrapper}
          onCommentDeleted={handleCommentDeletedWrapper}
        />
      )}

      {isRepostModalOpen && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalOverlay} onTouchStart={() => setRepostModalOpen(false)}>
            <View style={styles.modalContent} onTouchStart={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>Chia sẻ bài viết</Text>
              <TextInput
                style={styles.repostTextarea}
                value={repostContent}
                onChangeText={setRepostContent}
                placeholder="Thêm suy nghĩ của bạn..."
                multiline
                numberOfLines={4}
              />
              {!post.group && (
                <View style={styles.visibilitySelectContainer}>
                  <TouchableOpacity 
                    style={[
                      styles.visibilityOption, 
                      visibility === PostVisibility.PUBLIC && styles.visibilityOptionSelected
                    ]}
                    onPress={() => setVisibility(PostVisibility.PUBLIC)}
              >
                <Text style={styles.visibilityOptionText}>Công khai</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.visibilityOption, 
                  visibility === PostVisibility.FRIENDS_ONLY && styles.visibilityOptionSelected
                ]}
                onPress={() => setVisibility(PostVisibility.FRIENDS_ONLY)}
              >
                <Text style={styles.visibilityOptionText}>Chỉ bạn bè</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.visibilityOption, 
                  visibility === PostVisibility.PRIVATE && styles.visibilityOptionSelected
                ]}
                onPress={() => setVisibility(PostVisibility.PRIVATE)}
              >
                <Text style={styles.visibilityOptionText}>Chỉ mình tôi</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => setRepostModalOpen(false)}
            >
              <Text>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.modalButtonPrimary}
              onPress={handleRepostSubmit}
            >
              <Text style={styles.modalButtonPrimaryText}>Chia sẻ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )}

  {isDeleteModalOpen && (
    <Modal visible transparent animationType="fade">
      <View style={styles.modalOverlay} onTouchStart={() => setDeleteModalOpen(false)}>
        <View style={styles.modalContent} onTouchStart={(e) => e.stopPropagation()}>
          <Text style={styles.modalTitle}>Xác nhận xóa</Text>
          <Text style={styles.modalMessage}>
            Bạn có chắc chắn muốn xóa bài viết này không?
          </Text>
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => setDeleteModalOpen(false)}
            >
              <Text>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.modalButtonDanger}
              onPress={confirmDelete}
            >
              <Text style={styles.modalButtonDangerText}>Xóa</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )}

  {isReportModalOpen && (
    <ReportModal
      onClose={() => setReportModalOpen(false)}
      onSubmit={(reason) => {
        // Handle report submission
        console.log("Report submitted:", reason);
        setReportModalOpen(false);
      }}
      postId={post._id}
      userId={post.author._id}
    />
  )}

  {isEditModalOpen && (
    <EditModal
      post={post}
      onClose={() => setEditModalOpen(false)}
      onSubmit={handleUpdatePost}
    />
  )}
</View>
  );
};
const styles = StyleSheet.create({
  postCard: {
    backgroundColor: '#083b38',
    borderRadius: 12,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#0e4420',
  },
  repostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  repostText: {
    color: '#a3b18a',
    fontSize: 14,
  },
  repostAuthor: {
    color: '#c1cd78',
    fontWeight: 'bold',
  },
  reposterComment: {
    color: '#d5e4c3',
    marginBottom: 15,
    fontSize: 16,
    lineHeight: 22,
  },
  originalPostEmbed: {
    backgroundColor: '#0e4420',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#1a5d48',
  },
  postEmbedError: {
    color: '#ff6b6b',
    padding: 15,
    textAlign: 'center',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorName: {
    color: '#d5e4c3',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
  timestamp: {
    color: '#a3b18a',
    fontSize: 12,
    marginLeft: 10,
    marginTop: 2,
  },
  postOptions: {
    position: 'relative',
  },
  optionsTrigger: {
    padding: 5,
  },
  optionsDots: {
    fontSize: 18,
    color: '#a3b18a',
  },
  optionsMenu: {
    position: 'absolute',
    right: 0,
    top: 30,
    backgroundColor: '#0e4420',
    borderRadius: 8,
    padding: 5,
    zIndex: 100,
    minWidth: 150,
    borderWidth: 1,
    borderColor: '#1a5d48',
  },
  optionsMenuItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  optionsMenuText: {
    color: '#d5e4c3',
  },
  postContent: {
    color: '#d5e4c3',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 15,
  },
  postMedia: {
    position: 'relative',
    marginBottom: 15,
  },
  mediaImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
  },
  showMoreOverlay: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  showMoreText: {
    color: 'white',
    fontWeight: 'bold',
  },
  lightboxOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxContent: {
    width: '90%',
    height: '80%',
    position: 'relative',
  },
  lightboxClose: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxCloseText: {
    color: '#fff',
    fontSize: 18,
  },
  lightboxImage: {
    width: '100%',
    height: '100%',
  },
  postStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  postStat: {
    color: '#a3b18a',
    fontSize: 14,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  actionButton: {
    padding: 10,
  },
  actionButtonText: {
    color: '#d5e4c3',
    fontSize: 16,
  },
  reactionContainer: {
    position: 'relative',
  },
  reactionPopup: {
    flexDirection: 'row',
    backgroundColor: '#0e4420',
    borderRadius: 20,
    padding: 5,
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: '#1a5d48',
  },
  reactionIcon: {
    padding: 5,
  },
  reactionEmoji: {
    fontSize: 24,
  },
  commentSection: {
    marginTop: 10,
  },
  commentForm: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#0e4420',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    color: '#fff',
  },
  commentSubmitButton: {
    marginLeft: 10,
    backgroundColor: '#3ea6ff',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  commentSubmitButtonDisabled: {
    backgroundColor: '#555',
  },
  commentSubmitText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  commentList: {
    marginTop: 10,
  },
  comment: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  commentReply: {
    marginLeft: 30,
  },
  commentContent: {
    marginLeft: 10,
    flex: 1,
  },
  commentAuthor: {
    fontWeight: 'bold',
    color: '#c1cd78',
  },
  commentText: {
    color: '#d5e4c3',
    marginVertical: 5,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyButton: {
    marginRight: 10,
  },
  replyButtonText: {
    color: '#3ea6ff',
  },
  commentDeleteButton: {
    marginLeft: 10,
  },
  commentDeleteText: {
    color: '#ff6b6b',
  },
  replyForm: {
    marginTop: 5,
    marginLeft: 10,
  },
  replyInput: {
    backgroundColor: '#0e4420',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    color: '#fff',
  },
  replyActions: {
    flexDirection: 'row',
    marginTop: 5,
  },
  replyCancelButton: {
    marginLeft: 10,
  },
  viewRepliesBtn: {
    marginTop: 5,
  },
  viewRepliesText: {
    color: '#3ea6ff',
  },
  replies: {
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#083b38',
    borderRadius: 12,
    padding: 20,
    width: '90%',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
  },
  modalButton: {
    padding: 10,
    marginLeft: 10,
  },
  modalButtonPrimary: {
    padding: 10,
    marginLeft: 10,
    backgroundColor: '#3ea6ff',
    borderRadius: 6,
  },
  modalButtonPrimaryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalButtonDanger: {
    padding: 10,
    marginLeft: 10,
    backgroundColor: '#ff4d6d',
    borderRadius: 6,
  },
  modalButtonDangerText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalMessage: {
    color: '#d5e4c3',
    marginVertical: 10,
  },
  reportModal: {
    minHeight: 200,
  },
  reportTextarea: {
    backgroundColor: '#0e4420',
    borderRadius: 8,
    padding: 10,
    color: '#fff',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  editTextarea: {
    backgroundColor: '#0e4420',
    borderRadius: 8,
    padding: 10,
    color: '#fff',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  repostTextarea: {
    backgroundColor: '#0e4420',
    borderRadius: 8,
    padding: 10,
    color: '#fff',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  visibilitySelectContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  visibilityOption: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: '#1a5d48',
    alignItems: 'center',
  },
  visibilityOptionSelected: {
    backgroundColor: '#3ea6ff',
  },
  visibilityOptionText: {
    color: '#fff',
  },
});


export default PostCard;