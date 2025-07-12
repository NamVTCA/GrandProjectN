import React from 'react';
import Button from '../../../components/common/Button';
import api from '../../../services/api';
import { useToast } from '../../../components/common/Toast/ToastContext';
import './GroupCard.scss';

export interface Group {
  _id: string;
  name: string;
  description: string;
  interests: { name: string }[];
}

interface GroupCardProps {
  group: Group;
}

const GroupCard: React.FC<GroupCardProps> = ({ group }) => {
  const { addToast } = useToast();

  const handleJoin = async () => {
    try {
      await api.post(`/groups/${group._id}/join`);
      addToast(`Đã gửi yêu cầu tham gia nhóm ${group.name}!`, 'success');
    } catch (error: any) {
      addToast(error.response?.data?.message || 'Không thể tham gia nhóm.', 'error');
    }
  };

  return (
    <div className="group-card">
      <div className="group-card-header">
        {/* Thêm ảnh bìa cho nhóm sau */}
      </div>
      <div className="group-card-body">
        <h3>{group.name}</h3>
        <p>{group.description}</p>
        <div className="tags">
          {group.interests.map(interest => <span key={interest.name} className="tag">{interest.name}</span>)}
        </div>
      </div>
      <div className="group-card-footer">
        <Button onClick={handleJoin}>Tham gia</Button>
      </div>
    </div>
  );
};

export default GroupCard;
