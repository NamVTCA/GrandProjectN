import React from 'react';
import { Link } from 'react-router-dom';
import UserAvatar from '../common/UserAvatar';
import { publicUrl } from '../../untils/publicUrl';
import './SearchResultItem.scss';

// Export để Header dùng lại cho đúng type
export interface UserResult {
  _id: string;
  username: string;     // bắt buộc
  avatar?: string;      // có thể thiếu
}

interface SearchResultItemProps {
  user: UserResult;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({ user }) => {
  const avatarUrl = user.avatar ? publicUrl(user.avatar) : '/default-avatar.png';

  return (
    <Link to={`/profile/${user.username}`} className="search-result-item">
      <div className="user-info">
        <UserAvatar src={avatarUrl} size={36} />
        <div className="text-block">
          <span className="title">{user.username}</span>
          <span className="subtitle">@{user.username}</span>
        </div>
      </div>
    </Link>
  );
};

export default SearchResultItem;
