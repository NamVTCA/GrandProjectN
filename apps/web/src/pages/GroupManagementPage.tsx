// File: src/pages/GroupManagementPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import type { JoinRequest } from '../features/groups/types/Group';
import Button from '../components/common/Button';
import './GroupManagementPage.scss';

const GroupManagementPage: React.FC = () => {
  const { id: groupId } = useParams<{ id: string }>();
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJoinRequests = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    try {
      // Giả sử API endpoint để lấy yêu cầu tham gia là /groups/:id/requests
      const response = await api.get(`/groups/${groupId}/requests`);
      setJoinRequests(response.data);
    } catch (error) {
      console.error("Lỗi khi tải yêu cầu tham gia:", error);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchJoinRequests();
  }, [fetchJoinRequests]);

  const handleRequest = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      // Giả sử API endpoint để xử lý yêu cầu là /groups/requests/:requestId
      await api.post(`/groups/requests/${requestId}`, { action });
      // Tải lại danh sách sau khi xử lý
      fetchJoinRequests();
    } catch (error) {
      console.error(`Lỗi khi ${action} yêu cầu:`, error);
      alert('Có lỗi xảy ra, vui lòng thử lại.');
    }
  };

  return (
    <div className="group-management-page">
      <h1>Quản lý Nhóm</h1>
      <div className="management-tabs">
        <button className="tab-button active">Yêu cầu tham gia</button>
        <button className="tab-button">Thành viên</button>
      </div>
      <div className="tab-content">
        {loading ? (
          <p>Đang tải danh sách...</p>
        ) : (
          <div className="request-list">
            {joinRequests.length > 0 ? (
              joinRequests.map(req => (
                <div key={req._id} className="request-item">
                  <div className="user-info">
                    <img src={req.user.avatar || 'https://via.placeholder.com/48'} alt={req.user.username} />
                    <strong>{req.user.username}</strong>
                  </div>
                  <div className="request-actions">
                    <Button onClick={() => handleRequest(req._id, 'approve')}>Chấp nhận</Button>
                    <Button onClick={() => handleRequest(req._id, 'reject')} variant="secondary">Từ chối</Button>
                  </div>
                </div>
              ))
            ) : (
              <p>Không có yêu cầu tham gia nào.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupManagementPage;