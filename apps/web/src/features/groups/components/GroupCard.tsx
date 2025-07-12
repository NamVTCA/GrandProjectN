// File: src/features/groups/components/GroupCard.tsx
import React from 'react';
import type { Group } from '../types/Group';
import Button from '../../../components/common/Button';
import api from '../../../services/api';
import './GroupCard.scss';

interface GroupCardProps {
  group: Group;
}

const GroupCard: React.FC<GroupCardProps> = ({ group }) => {
  const handleJoin = async () => {
    try {
      await api.post(`/groups/${group._id}/join`);
      alert(`Đã gửi yêu cầu tham gia nhóm ${group.name}!`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể tham gia nhóm.');
    }
  };

  return (
    <div className="group-card">
      <div className="group-card-header">
        {/* Placeholder for group cover image */}
      </div>
      <div className="group-card-body">
        <h3>{group.name}</h3>
        <p>{group.description}</p>
        <div className="tags">
          {group.interests.map(interest => <span key={interest._id} className="tag">{interest.name}</span>)}
        </div>
      </div>
      <div className="group-card-footer">
        <Button onClick={handleJoin}>Tham gia</Button>
      </div>
    </div>
  );
};

export default GroupCard;