// File: apps/web/src/pages/GroupDetailPage.tsx
// Description: Refactored detail page to use the GroupHeader component.

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api'; // api là một AxiosInstance
import type { GroupDetail, GroupMember } from '../features/groups/types/Group';
import { useAuth } from '../features/auth/AuthContext';
import { useToast } from '../components/common/Toast/ToastContext';
import GroupHeader from '../features/groups/components/GroupHeader';
import './GroupDetailPage.scss';

// Component danh sách thành viên (giữ nguyên)
const MemberList: React.FC<{ members: GroupMember[] }> = ({ members }) => (
  <div className="widget-card">
    <h2>Thành viên ({members.length})</h2>
    <ul className="member-list">
      {members.map(member => (
        <li key={member._id} className="member-item">
          <Link to={`/profile/${member._id}`}>
            <img src={member.avatar || 'https://placehold.co/50x50/2a2a2a/ffffff?text=U'} alt={member.username} />
            <div className="member-info">
              <span className="username">{member.username}</span>
              <span className="role">{member.role}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

const GroupDetailPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Hàm fetch dữ liệu nhóm (đã sửa)
  useEffect(() => {
    if (!groupId) return;
    const fetchGroup = async () => {
      try {
        setLoading(true);
        // SỬA Ở ĐÂY: Dùng api.get với URL
        const response = await api.get(`/groups/${groupId}`);
        setGroup(response.data);
      } catch (error) {
        addToast('Không tìm thấy nhóm hoặc có lỗi xảy ra.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchGroup();
  }, [groupId, addToast]);

  // Logic xác định vai trò thành viên (giữ nguyên)
  const { isMember, isOwner } = useMemo(() => {
    if (!user || !group) return { isMember: false, isOwner: false };
    const member = group.members.find(m => m._id === user._id);
    return {
      isMember: !!member,
      isOwner: group.owner === user._id,
    };
  }, [user, group]);

  // Logic xử lý tham gia/rời nhóm (đã sửa)
  const handleJoinLeave = async () => {
    if (!groupId) return;
    setIsProcessing(true);
    try {
      // SỬA Ở ĐÂY: Xác định endpoint và dùng api.post()
      const endpoint = isMember ? `/groups/${groupId}/leave` : `/groups/${groupId}/join`;
      await api.post(endpoint);

      addToast(isMember ? 'Bạn đã rời khỏi nhóm.' : 'Yêu cầu tham gia đã được gửi.', 'success');

      // SỬA Ở ĐÂY: Lấy lại dữ liệu nhóm sau khi hành động thành công
      const updatedResponse = await api.get(`/groups/${groupId}`);
      setGroup(updatedResponse.data);
    } catch (error: any) {
      addToast(error.response?.data?.message || 'Thao tác thất bại.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="page-loading">Đang tải thông tin nhóm...</div>;
  if (!group) return <div className="page-loading">Không tìm thấy nhóm.</div>;

  return (
    <div className="group-detail-page">
      {/* SỬ DỤNG COMPONENT GROUPHEADER */}
      <GroupHeader
        group={group}
        isMember={isMember}
        isOwner={isOwner}
        onJoinLeaveClick={handleJoinLeave}
        isProcessing={isProcessing}
      />

      <main className="group-body">
        <div className="main-content">
          <div className="widget-card">
            <h2>Bài viết (sắp có)</h2>
          </div>
        </div>
        <aside className="sidebar-content">
          <div className="widget-card">
            <h2>Giới thiệu</h2>
            <p>{group.description}</p>
            {group.interests.length > 0 && (
              <div className="interests-section">
                <h4>Sở thích</h4>
                <div className="interests-tags">
                  {group.interests.map(interest => (
                    <span key={interest._id} className="tag">{interest.name}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <MemberList members={group.members} />
        </aside>
      </main>
    </div>
  );
};

export default GroupDetailPage;