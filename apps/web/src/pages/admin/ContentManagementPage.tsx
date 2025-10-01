// ContentManagementPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../components/common/Toast/ToastContext';
import type { ModeratedPost, ModeratedComment } from '../../features/admin/types/Moderation';
import Button from '../../components/common/Button';
import './AdminPages.scss';

export interface Report {
  _id: string;
  type: 'POST' | 'COMMENT' | 'USER';
  targetId: string;
  reason: string;
  createdAt: string;
  reporter: {
    username: string;
    avatar: string;
  };
}

const ContentManagementPage: React.FC = () => {
  const [posts, setPosts] = useState<ModeratedPost[]>([]);
  const [comments, setComments] = useState<ModeratedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const [queueRes, reportsRes] = await Promise.all([
        api.get('/admin/moderation-queue'),
        api.get('/reports/all')
      ]);
      const queueData = queueRes.data as { posts: ModeratedPost[]; comments: ModeratedComment[] };
      setPosts(queueData.posts);
      setComments(queueData.comments);
      setReports(reportsRes.data as Report[]);
    } catch (error) {
      addToast("Lỗi khi tải dữ liệu", 'error');
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
      fetchQueue();
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
        <h2>Tất cả báo cáo ({reports.length})</h2>
        <div className="reports-grid">
          {reports.map(report => (
            <div key={report._id} className="report-card">
              <div className="report-header">
                <span className="reporter">@{report.reporter.username}</span>
                <span className="report-date">{new Date(report.createdAt).toLocaleString()}</span>
              </div>
              <div className="report-meta">
                <span className="report-type">{report.type}</span>
                {report.type === 'USER' ? (
                  <Link to={`/admin/users/${report.targetId}`} className="report-link">
                    Xem người dùng
                  </Link>
                ) : report.type === 'POST' ? (
                  <Link to={`/posts/${report.targetId}`} className="report-link">
                    Xem bài viết
                  </Link>
                ) : report.type === 'COMMENT' ? (
                  <span className="report-link">Bình luận #{report.targetId}</span>
                ) : null}
              </div>
              <div className="report-reason">
                <p>Lý do: {report.reason}</p>
              </div>
            </div>
          ))}
          {reports.length === 0 && <p>Không có báo cáo nào.</p>}
        </div>
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
