import React, { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';
import { useToast } from '../../components/common/Toast/ToastContext';
import type { ModeratedPost, ModeratedComment } from '../../features/admin/types/Moderation';
import Button from '../../components/common/Button';
import './AdminPages.scss';

const ContentManagementPage: React.FC = () => {
  const [posts, setPosts] = useState<ModeratedPost[]>([]);
  const [comments, setComments] = useState<ModeratedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/moderation-queue');
      setPosts(response.data.posts);
      setComments(response.data.comments);
    } catch (error) {
      addToast("Lỗi khi tải hàng đợi kiểm duyệt", 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleAction = async (type: 'posts' | 'comments', id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.patch(`/admin/${type}/${id}/status`, { status });
      addToast(`Đã ${status === 'APPROVED' ? 'phê duyệt' : 'từ chối'} nội dung.`, 'success');
      fetchQueue(); // Tải lại danh sách
    } catch (error) {
      addToast('Có lỗi xảy ra', 'error');
    }
  };

  if (loading) return <p>Đang tải...</p>;

  return (
    <div className="admin-page">
      <h1>Quản lý Nội dung</h1>
      
      <div className="content-section">
        <h2>Bài đăng chờ duyệt ({posts.length})</h2>
        {posts.length > 0 ? (
          posts.map(post => (
            <div key={post._id} className="moderation-item">
              <p><strong>@{post.author.username}</strong> đã đăng:</p>
              <blockquote>{post.content}</blockquote>
              <div className="actions">
                <Button onClick={() => handleAction('posts', post._id, 'APPROVED')}>Duyệt</Button>
                <Button onClick={() => handleAction('posts', post._id, 'REJECTED')} variant="secondary">Từ chối</Button>
              </div>
            </div>
          ))
        ) : <p>Không có bài đăng nào chờ duyệt.</p>}
      </div>

      <div className="content-section">
        <h2>Bình luận chờ duyệt ({comments.length})</h2>
        {comments.length > 0 ? (
          comments.map(comment => (
            <div key={comment._id} className="moderation-item">
              <p><strong>@{comment.author.username}</strong> đã bình luận trong bài đăng:</p>
              <blockquote className="parent-post">{comment.post.content}</blockquote>
              <blockquote className="main-content">{comment.content}</blockquote>
              <div className="actions">
                <Button onClick={() => handleAction('comments', comment._id, 'APPROVED')}>Duyệt</Button>
                <Button onClick={() => handleAction('comments', comment._id, 'REJECTED')} variant="secondary">Từ chối</Button>
              </div>
            </div>
          ))
        ) : <p>Không có bình luận nào chờ duyệt.</p>}
      </div>
    </div>
  );
};

export default ContentManagementPage;