import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // 1. Import useNavigate
import type { Group } from '../types/Group';
import Button from '../../../components/common/Button';
import api from '../../../services/api';
import './GroupCard.scss';

interface GroupCardProps {
  group: Group;
  isMember: boolean;
  isOwner: boolean;
  onGroupUpdate: () => void;
}

const GroupCard: React.FC<GroupCardProps> = ({ group, isMember, isOwner, onGroupUpdate }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate(); // 2. Khởi tạo hook navigate

  const handleJoinClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Ngăn sự kiện click lan ra toàn bộ card
    setIsProcessing(true);
    try {
      await api.post(`/groups/${group._id}/join`);
      onGroupUpdate();
    } catch (error) {
      console.error("Lỗi khi tham gia nhóm:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Hàm để điều hướng khi click vào card (trừ các nút)
  const handleCardClick = () => {
    navigate(`/groups/${group._id}`);
  };

  const renderActionButton = () => {
    if (isOwner) {
      return (
        // Nút này vẫn là Link, nhưng không còn bị lồng nữa
        <Link to={`/groups/${group._id}/manage`} onClick={e => e.stopPropagation()} className="action-link">
          <Button variant="secondary">Quản lý</Button>
        </Link>
      );
    }
    if (isMember) {
      return (
        <Link to={`/groups/${group._id}`} onClick={e => e.stopPropagation()} className="action-link">
          <Button variant="primary">Xem nhóm</Button>
        </Link>
      );
    }
    return (
      // Nút này là một button, không phải link
      <Button variant="primary" onClick={handleJoinClick} disabled={isProcessing}>
        {isProcessing ? 'Đang xử lý...' : 'Tham gia'}
      </Button>
    );
  };

  return (
    // ✅ SỬA LỖI: Thay thế <Link> bằng <div onClick>
    <div onClick={handleCardClick} className="group-card" role="link" tabIndex={0}>
      <div className="card-banner">
        <img src={group.coverImage || 'https://placehold.co/300x120/25282e/a9b3c1?text=Cover'} alt={`${group.name} cover`} />
      </div>
      <div className="card-content">
        <div className="card-avatar">
          <img src={group.avatar || 'https://placehold.co/80x80/363a41/f0f2f5?text=Logo'} alt={`${group.name} avatar`} />
        </div>
        <h3 className="group-name">{group.name}</h3>
        <p className="member-count">{group.memberCount} thành viên</p>
        <div className="card-actions">
          {renderActionButton()}
        </div>
      </div>
    </div>
  );
};

export default GroupCard;