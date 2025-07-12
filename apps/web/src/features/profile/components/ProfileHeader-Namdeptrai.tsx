import React from 'react';
import Button from '../../../components/common/Button';
import './ProfileHeader.scss';

// Mở rộng interface User để bao gồm các trường mới
export interface UserProfile {
  _id: string;
  username: string;
  avatar: string;
  coverImage: string;
  bio: string;
  followers: string[];
  following: string[];
}

interface ProfileHeaderProps {
  userProfile: UserProfile;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ userProfile }) => {
  // Logic cho việc follow/unfollow sẽ được thêm sau
  const handleFollow = () => { console.log('Follow user'); };

  return (
    <header className="profile-header">
      <div className="cover-image">
        <img src={userProfile.coverImage || 'https://via.placeholder.com/1200x300'} alt="Cover" />
      </div>
      <div className="profile-info">
        <img className="avatar" src={userProfile.avatar || 'https://via.placeholder.com/150'} alt="Avatar" />
        <div className="user-details">
          <h1>{userProfile.username}</h1>
          <p className="bio">{userProfile.bio}</p>
          <div className="stats">
            <span><strong>{userProfile.following.length}</strong> Đang theo dõi</span>
            <span><strong>{userProfile.followers.length}</strong> Người theo dõi</span>
          </div>
        </div>
        <div className="profile-actions">
          <Button onClick={handleFollow}>Theo dõi</Button>
          {/* Thêm các nút khác như Nhắn tin, Kết bạn... */}
        </div>
      </div>
    </header>
  );
};

export default ProfileHeader;