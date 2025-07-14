// File: src/pages/GroupDetailPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import type { GroupDetail } from '../features/groups/types/Group';
import GroupHeader from '../features/groups/components/GroupHeader';
import './GroupDetailPage.scss';

const GroupDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchGroupDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      // Giả sử API endpoint để lấy chi tiết nhóm là /groups/:id
      const response = await api.get(`/groups/${id}`);
      setGroup(response.data);
    } catch (error) {
      console.error("Lỗi khi tải chi tiết nhóm:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchGroupDetails();
  }, [fetchGroupDetails]);

  if (loading) return <p className="page-status">Đang tải thông tin nhóm...</p>;
  if (!group) return <p className="page-status error">Không tìm thấy nhóm này.</p>;

  return (
    <div className="group-detail-page">
      <GroupHeader group={group} />
      <div className="group-content">
        {/* Các tab và nội dung tương ứng sẽ được thêm vào đây */}
        <h3>Bài đăng trong nhóm</h3>
        <p className="placeholder-text">Chưa có bài đăng nào.</p>
      </div>
    </div>
  );
};

export default GroupDetailPage;