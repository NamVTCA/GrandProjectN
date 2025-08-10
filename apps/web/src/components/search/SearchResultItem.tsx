import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Button from '../common/Button';
import UserAvatar from '../common/UserAvatar';
import './SearchResultItem.scss';

// Export để Header dùng lại cho đúng type
export interface UserResult {
  _id: string;
  username: string;     // bắt buộc
  avatar?: string;      // có thể thiếu
  friendshipStatus?: 'FRIENDS' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'NONE';
}

interface SearchResultItemProps {
  user: UserResult;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({ user }) => {
  const [status, setStatus] = useState(user.friendshipStatus || 'NONE');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAddFriend = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsProcessing(true);
    try {
      await api.post(`/friends/request/${user._id}`);
      setStatus('REQUEST_SENT');
    } catch (error) {
      console.error('Lỗi khi gửi lời mời kết bạn:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderAction = () => {
    switch (status) {
      case 'FRIENDS':
        return <Button variant="secondary" disabled>Bạn bè</Button>;
      case 'REQUEST_SENT':
        return <Button variant="secondary" disabled>Đã gửi lời mời</Button>;
      case 'REQUEST_RECEIVED':
        return (
          <Link to="/notifications">
            <Button variant="primary">Phản hồi</Button>
          </Link>
        );
      default:
        return (
          <Button variant="primary" onClick={handleAddFriend} disabled={isProcessing}>
            Kết bạn
          </Button>
        );
    }
  };

  return (
    <Link to={`/profile/${user.username}`} className="search-result-item">
      <div className="user-info">
        {/* Không dùng placeholder: nếu không có avatar -> trống */}
        <UserAvatar src={user.avatar} size={36} />
        <span>{user.username}</span>
      </div>
      <div className="action-button" onClick={(e) => e.stopPropagation()}>
        {renderAction()}
      </div>
    </Link>
  );
};

export default SearchResultItem;
