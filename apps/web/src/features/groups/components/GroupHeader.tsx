// File: src/features/groups/components/GroupHeader.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import type { GroupDetail } from '../types/Group';
import { useAuth } from '../../auth/AuthContext';
import Button from '../../../components/common/Button';
import { FaCog } from 'react-icons/fa';
import './GroupHeader.scss';

interface GroupHeaderProps {
  group: GroupDetail;
}

const GroupHeader: React.FC<GroupHeaderProps> = ({ group }) => {
  const { user } = useAuth();
  const isOwner = user?._id === group.owner;

  // Logic join/leave sẽ được thêm sau
  const handleJoin = () => console.log('Join Group');

  return (
    <header className="group-detail-header">
      <div className="cover-image">
        {/* Placeholder for group cover image */}
      </div>
      <div className="group-info">
        <h2>{group.name}</h2>
        <p>{group.members.length} thành viên</p>
      </div>
      <div className="group-actions">
        {isOwner ? (
          <Link to={`/groups/${group._id}/manage`}>
            <Button variant="secondary">
              <FaCog /> Quản lý
            </Button>
          </Link>
        ) : (
          <Button onClick={handleJoin}>Tham gia nhóm</Button>
        )}
      </div>
    </header>
  );
};

export default GroupHeader;