import React, { useState } from 'react';
import Button from '../../../components/common/Button';
import api from '../../../services/api';
import { useToast } from '../../../components/common/Toast/ToastContext';
import './CreatePost.scss';

interface CreatePostProps {
  onPostCreated: () => void; // Callback để làm mới dòng thời gian
}

const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await api.post('/posts', { content });
      addToast('Đăng bài thành công!', 'success');
      setContent('');
      onPostCreated(); // Gọi callback để tải lại bài đăng
    } catch (error) {
      addToast('Đăng bài thất bại.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-post-card">
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Bạn đang nghĩ gì?"
          rows={3}
        />
        <div className="actions">
          <Button type="submit" disabled={!content.trim() || isSubmitting}>
            {isSubmitting ? 'Đang đăng...' : 'Đăng'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;