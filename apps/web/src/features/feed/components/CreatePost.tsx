import React, { useState, useRef } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../auth/AuthContext';
import type { Post } from '../types/Post'; // 1. Import Post type
import './CreatePost.scss';

// 2. Cập nhật interface để onPostCreated có thể nhận bài viết mới
interface CreatePostProps {
  onPostCreated: (newPost: Post) => void;
  context?: 'profile' | 'group';
  contextId?: string;
}

const CreatePost: React.FC<CreatePostProps> = ({ 
  onPostCreated, 
  context = 'profile',
  contextId 
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const CLOUDINARY_CLOUD_NAME = "das4ycyz9";
  const CLOUDINARY_UPLOAD_PRESET = "SocialMedia";
  const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setMediaFiles(Array.from(e.target.files));
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    try {
      const response = await fetch(CLOUDINARY_URL, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.secure_url) {
        return data.secure_url;
      } else {
        throw new Error('Không thể tải file lên Cloudinary.');
      }
    } catch (err) {
      console.error("Lỗi tải file lên Cloudinary:", err);
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && mediaFiles.length === 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const mediaUrls = await Promise.all(
        mediaFiles.map(file => uploadFile(file))
      );

      const payload: { content: string; mediaUrls: string[]; groupId?: string } = {
        content,
        mediaUrls,
      };

      if (context === 'group' && contextId) {
        payload.groupId = contextId;
      }
      
      // 3. Lấy kết quả bài viết mới từ API
      const response = await api.post<Post>('/posts', payload);
      const newPost = response.data; // Đây là bài viết mới server trả về

      // Reset form
      setContent('');
      setMediaFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      // 4. Gửi bài viết mới về cho component cha để cập nhật UI ngay lập tức
      onPostCreated(newPost);

    } catch (err: any) {
      console.error("Lỗi khi đăng bài:", err);
      setError(err.response?.data?.message || "Đã có lỗi xảy ra.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-post-card">
      <div className="card-header">
        <img src={user?.avatar || 'https://via.placeholder.com/48'} alt="User Avatar" className="user-avatar" />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Bạn đang nghĩ gì, ${user?.username}?`}
          rows={3}
        />
      </div>
      <div className="card-footer">
        <div className="actions">
            <button className="action-btn" onClick={() => fileInputRef.current?.click()}>
                Ảnh/Video
            </button>
        </div>
        <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            accept="image/*,video/*"
        />
        <button className="submit-btn" onClick={handleSubmit} disabled={(!content.trim() && mediaFiles.length === 0) || isSubmitting}>
          {isSubmitting ? 'Đang đăng...' : 'Đăng'}
        </button>
      </div>
      {mediaFiles.length > 0 && (
       <div className="media-preview">
           {mediaFiles.map((file, index) => (
               <p key={index}>{file.name}</p>
           ))}
       </div>
     )}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default CreatePost;