import React, { useState, useRef, useEffect } from "react";
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

  const CLOUDINARY_CLOUD_NAME = "das4ycyz9";
  const CLOUDINARY_UPLOAD_PRESET = "SocialMedia";
  const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;

  // cleanup URL để tránh leak bộ nhớ
  useEffect(() => {
    return () => {
      mediaFiles.forEach((file) => {
        const url = URL.createObjectURL(file);
        URL.revokeObjectURL(url);
      });
    };
  }, [mediaFiles]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setMediaFiles([...mediaFiles, ...Array.from(e.target.files)]);
    }
    // reset input để có thể chọn lại cùng file
    e.target.value = "";
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    const response = await fetch(CLOUDINARY_URL, {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (data.secure_url) {
      return data.secure_url;
    }
    throw new Error("Không thể tải file lên Cloudinary.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

      if (response.data && response.data._id) {
        setContent("");
        setMediaFiles([]);
        setVisibility(PostVisibility.PUBLIC);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        onPostCreated(response.data);
      } else {
        throw new Error("Dữ liệu bài viết trả về không hợp lệ");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "Đã có lỗi xảy ra."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    const removed = mediaFiles[index];
    const url = URL.createObjectURL(removed);
    URL.revokeObjectURL(url);

    setMediaFiles(mediaFiles.filter((_, i) => i !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="create-post-card">
      <div className="card-header">
        <UserAvatar size={40} src={(user as any)?.avatar} />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Bạn đang nghĩ gì, ${user?.username}?`}
          rows={2}
        />
      </div>

      <div className="card-footer">
        <button
          className="action-btn"
          onClick={() => fileInputRef.current?.click()}
        >
          Ảnh/Video
        </button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept="image/*,video/*"
          multiple
          onChange={handleFileChange}
        />

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
      </div>

      <div className="post-submit">
        <button
          className="submit-btn"
          onClick={handleSubmit}
          disabled={
            (!content.trim() && mediaFiles.length === 0) || isSubmitting
          }
        >
          {isSubmitting ? "Đang đăng..." : "Đăng"}
        </button>
      </div>

      {mediaFiles.length > 0 && (
        <div className="media-preview">
          {mediaFiles.map((file, index) => {
            const url = URL.createObjectURL(file);
            return (
              <div key={index} className="media-item">
                {file.type.startsWith("image/") ? (
                  <img src={url} alt={file.name} />
                ) : (
                  <video src={url} controls />
                )}
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => handleRemoveFile(index)}
                >
                  ❌
                </button>
              </div>
            );
          })}
        </div>
      )}

      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default CreatePost;
