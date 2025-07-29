// File: src/features/groups/components/GroupHeader.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import type { GroupDetail } from '../types/Group';
import Button from '../../../components/common/Button';
import { FaCog, FaSignInAlt, FaSignOutAlt } from 'react-icons/fa'; // Thêm icons cho sinh động
import './GroupHeader.scss';

// 1. Mở rộng props để nhận đầy đủ trạng thái từ component cha
interface GroupHeaderProps {
  group: GroupDetail;
  isMember: boolean;
  isOwner: boolean;
  onJoinLeaveClick: () => void;
  isProcessing: boolean;
}

const GroupHeader: React.FC<GroupHeaderProps> = ({
  // 2. Nhận các props mới ở đây
  group,
  isMember,
  isOwner,
  onJoinLeaveClick,
  isProcessing,
}) => {
  // 3. Xóa logic `useAuth` và `isOwner` khỏi component này

  // Hàm để tạo nút hành động một cách linh hoạt
  const renderActionButton = () => {
    // Nếu là chủ sở hữu, hiển thị nút Quản lý
    if (isOwner) {
      return (
        <Link to={`/groups/${group._id}/settings`}>
          <Button variant="secondary" disabled={isProcessing}>
            <FaCog /> Quản lý nhóm
          </Button>
        </Link>
      );
    }

    // Nếu không phải chủ sở hữu, hiển thị nút Tham gia/Rời nhóm
    return (
      <Button
        onClick={onJoinLeaveClick}
        disabled={isProcessing}
        variant={isMember ? 'secondary' : 'primary'}
      >
        {isProcessing ? (
          'Đang xử lý...'
        ) : isMember ? (
          <>
            <FaSignOutAlt /> Rời khỏi nhóm
          </>
        ) : (
          <>
            <FaSignInAlt /> Tham gia nhóm
          </>
        )}
      </Button>
    );
  };

  return (
    <header className="group-header">
      <div
        className="group-cover-photo"
        style={{
          backgroundImage: `url(${group.coverImage || 'https://placehold.co/1200x400/2a2a2a/404040?text=Cover'})`,
        }}
      >
        <div className="group-info-container">
          <div className="group-avatar">
            <img
              src={
                group.avatar ||
                'https://placehold.co/150x150/2a2a2a/ffffff?text=G'
              }
              alt={`${group.name} avatar`}
            />
          </div>
          <div className="group-details">
            <h1>{group.name}</h1>
            <p>
              {group.privacy === 'public' ? 'Công khai' : 'Riêng tư'} •{' '}
              {group.memberCount} thành viên
            </p>
          </div>
          <div className="group-actions">
            {/* 4. Sử dụng hàm renderActionButton để hiển thị nút chính xác */}
            {renderActionButton()}
          </div>
        </div>
      </div>
    </header>
  );
};

export default GroupHeader;