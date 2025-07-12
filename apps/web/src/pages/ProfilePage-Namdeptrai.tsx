import React from 'react';
// Bước 1: Import kiểu dữ liệu chuẩn từ nguồn duy nhất
import type { UserProfile } from '../features/profile/types/UserProfile';
import './ProfilePage.scss';

interface ProfileHeaderProps {
  userProfile: UserProfile;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ userProfile }) => {
  return (
    <header className="profile-header">
      <div className="cover-image-container">
        {/* Bước 2: Xử lý trường hợp coverImage có thể không tồn tại */}
        {userProfile.coverImage ? (
          <img src={userProfile.coverImage} alt="Cover" className="cover-image" />
        ) : (
          <div className="cover-image-placeholder"></div>
        )}
      </div>
      <div className="profile-details">
        <div className="avatar-container">
          {/* Xử lý trường hợp avatar có thể không tồn tại */}
          {userProfile.avatar ? (
            <img src={userProfile.avatar} alt={userProfile.username} className="avatar" />
          ) : (
            <div className="avatar-placeholder">{userProfile.username.charAt(0).toUpperCase()}</div>
          )}
        </div>
        <div className="user-info">
          <h2>{userProfile.name || userProfile.username}</h2>
          <p className="username">@{userProfile.username}</p>
          {/* Xử lý trường hợp bio có thể không tồn tại */}
          {userProfile.bio && <p className="bio">{userProfile.bio}</p>}
        </div>
        <div className="stats">
          {/* Xử lý trường hợp followers/following có thể không tồn tại */}
          <div><strong>{userProfile.followers?.length || 0}</strong> Followers</div>
          <div><strong>{userProfile.following?.length || 0}</strong> Following</div>
        </div>
      </div>
    </header>
  );
};

export default ProfileHeader;
