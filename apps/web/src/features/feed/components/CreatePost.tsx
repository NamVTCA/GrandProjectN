// File: src/features/feed/components/CreatePost.tsx
import React, { useState } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../auth/AuthContext';
import Button from '../../../components/common/Button';
import './CreatePost.scss';

interface CreatePostProps {
  onPostCreated: () => void; // Callback để làm mới trang chủ
}

const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await api.post('/posts', { content });
      setContent('');
      onPostCreated(); // Gọi callback để tải lại danh sách bài đăng
    } catch (error) {
      console.error("Lỗi khi đăng bài:", error);
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
          rows={2}
        />
      </div>
      <div className="card-footer">
        {/* Các nút thêm ảnh, video, icon... sẽ được thêm sau */}
        <Button onClick={handleSubmit} disabled={!content.trim() || isSubmitting}>
          {isSubmitting ? 'Đang đăng...' : 'Đăng'}
        </Button>
      </div>
    </div>
  );
};

export default CreatePost;