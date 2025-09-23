import React, { useState, useRef } from "react";
import api from "../../../services/api";
import { useAuth } from "../../auth/AuthContext";
import type { Post } from "../types/Post";
import { PostVisibility } from "../types/Post";
import UserAvatar from "../../../components/common/UserAvatar";
import "./CreatePost.scss";

interface CreatePostProps {
  onPostCreated: (newPost: Post) => void;
  context?: "profile" | "group";
  contextId?: string;
}

const CreatePost: React.FC<CreatePostProps> = ({
  onPostCreated,
  context = "profile",
  contextId,
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [visibility, setVisibility] = useState<PostVisibility>(
    PostVisibility.PUBLIC
  );

  // Cloudinary
  const CLOUDINARY_CLOUD_NAME = "das4ycyz9";
  const CLOUDINARY_UPLOAD_PRESET = "SocialMedia";
  const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length) {
      // Giữ hành vi cũ: đặt đúng đợt chọn hiện tại
      setMediaFiles(Array.from(e.target.files));
    }
  };

  const removeFileAt = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current && mediaFiles.length === 1) {
      fileInputRef.current.value = "";
    }
  };

  const clearAllFiles = () => {
    setMediaFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(CLOUDINARY_URL, { method: "POST", body: formData });
    const data = await response.json();

    if (data?.secure_url) return data.secure_url;
    if (data?.error?.message) throw new Error(data.error.message);
    throw new Error("Không thể tải file lên Cloudinary.");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!content.trim() && mediaFiles.length === 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const mediaUrls =
        mediaFiles.length > 0
          ? await Promise.all(mediaFiles.map((file) => uploadFile(file)))
          : [];

      const payload = {
        content,
        mediaUrls,
        groupId: context === "group" ? contextId : undefined,
        visibility,
      };

      const response = await api.post<Post>("/posts", payload);

      if (response.data && (response.data as any)?._id) {
        setContent("");
        clearAllFiles();
        setVisibility(PostVisibility.PUBLIC);
        onPostCreated(response.data);
      } else {
        throw new Error("Dữ liệu bài viết trả về không hợp lệ");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Đã có lỗi xảy ra.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="create-post-card" onSubmit={handleSubmit}>
      <div className="card-header">
        <UserAvatar
          size={40}
          src={
            (user as any)?.avatarUrl ||
            (user as any)?.avatar ||
            (user as any)?.avatar_url
          }
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Bạn đang nghĩ gì, ${user?.username}?`}
          rows={3}
        />
      </div>

      <div className="card-footer">
        <div className="actions">
          <button
            type="button"
            className="action-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            Ảnh/Video
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </div>

        <div className="footer-right">
          <div className="submit-row">
            {context !== "group" && (
              <select
                className="visibility-select"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as PostVisibility)}
              >
                <option value={PostVisibility.PUBLIC}>🌍 Công khai</option>
                <option value={PostVisibility.FRIENDS_ONLY}>👥 Bạn bè</option>
                <option value={PostVisibility.PRIVATE}>🔒 Riêng tư</option>
              </select>
            )}

            <button
              type="submit"
              className="submit-btn"
              disabled={(!content.trim() && mediaFiles.length === 0) || isSubmitting}
            >
              {isSubmitting ? "Đang đăng..." : "Đăng"}
            </button>
          </div>
        </div>
      </div>

      {mediaFiles.length > 0 && (
        <div className="media-preview">
          {/* Xóa tất cả: NGAY TRÊN danh sách file, canh phải */}
          <div className="media-header">
            <button
              type="button"
              className="clear-all-link"
              onClick={clearAllFiles}
              title="Xóa tất cả tệp đã chọn"
            >
              Xóa tất cả
            </button>
          </div>

          {mediaFiles.map((file, index) => (
            <p className="media-line" key={`${file.name}-${index}`}>
              <span className="media-name" title={file.name}>
                {file.name}
              </span>
              {/* nút × sát lề phải cả hàng */}
              <button
                type="button"
                className="remove-btn-abs"
                aria-label="Xoá tệp này"
                onClick={() => removeFileAt(index)}
                title="Xoá"
              >
                ×
              </button>
            </p>
          ))}
        </div>
      )}

      {error && <p className="error-message">{error}</p>}
    </form>
  );
};

export default CreatePost;
