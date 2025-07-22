import React, { useState, useRef } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../auth/AuthContext';
import './CreatePost.scss';

interface CreatePostProps {
  onPostCreated: () => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- CẤU HÌNH CLOUDINARY ---
  // THAY THẾ CÁC GIÁ TRỊ NÀY BẰNG THÔNG TIN TÀI KHOẢN CLOUDINARY CỦA BẠN
  const CLOUDINARY_CLOUD_NAME = "das4ycyz9"; // <-- THAY THẾ
  const CLOUDINARY_UPLOAD_PRESET = "SocialMedia"; // <-- THAY THẾ
  const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setMediaFiles(Array.from(e.target.files));
    }
  };

  // Hàm tải một file lên Cloudinary
  const uploadFile = async (file: File) => {
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
      // B1: Tải tất cả media files lên Cloudinary và lấy URLs
      const mediaUrls = await Promise.all(
        mediaFiles.map(file => uploadFile(file))
      );

      // B2: Gọi API của bạn để tạo bài đăng
      await api.post('/posts', {
        content,
        mediaUrls,
      });

      // B3: Reset form và thông báo thành công
      setContent('');
      setMediaFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onPostCreated();
    } catch (err: any) {
      console.error("Lỗi khi đăng bài:", err);
      setError(err.response?.data?.message || "Đã có lỗi xảy ra. Vui lòng thử lại.");
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
