// File: src/features/profile/components/ProfileHeader.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserProfile } from '../types/UserProfile';
import { useAuth } from '../../auth/AuthContext';
import Button from '../../../components/common/Button';
import './ProfileHeader.scss';
import { publicUrl } from '../../../untils/publicUrl';

interface ProfileHeaderProps {
  userProfile: UserProfile;
  isFollowing: boolean;
  onFollowToggle: () => void;
}
type UserLevelInfo = {
   level: string;
  description: string;
  color: string;
  icon?: string;
  xpToNextLevel: number;
};
const getUserLevelInfo = (xp: number): UserLevelInfo => {
  if (xp >= 20000) {
    return {
      level: 'Bậc thầy mạng xã hội',
      description: 'Biểu tượng trong cộng đồng',
      color: '#6f42c1',
      icon: '🪐',
      xpToNextLevel: 30000, // bạn tự đặt mức tiếp theo
    };
  } else if (xp >= 10000) {
    return {
      level: 'Người nổi tiếng',
      description: 'Có tiếng nói trong cộng đồng',
      color: '#d63384',
      icon: '🌟',
      xpToNextLevel: 20000,
    };
  } else if (xp >= 5000) {
    return {
      level: 'Lão làng',
      description: 'Được cộng đồng quan tâm',
      color: '#20c997',
      xpToNextLevel: 10000,
    };
  } else if (xp >= 2000) {
    return {
      level: 'Cựu thành viên',
      description: 'Tạo ảnh hưởng nhỏ',
      color: '#17a2b8',
      xpToNextLevel: 5000,
    };
  } else if (xp >= 500) {
    return {
      level: 'GenZ',
      description: 'Có tương tác thường xuyên',
      color: '#fd7e14',
      xpToNextLevel: 2000,
    };
  } else {
    return {
      level: 'Mới dùng mạng xã hội',
      description: 'Vừa tham gia',
      color: '#6c757d',
      xpToNextLevel: 500,
    };
  }
};


const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  userProfile,
  isFollowing,
  onFollowToggle,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMyProfile = user?._id === userProfile._id;
  const levelInfo = getUserLevelInfo(userProfile.xp);

  const handleEditProfile = () => {
    navigate(`/profile/${userProfile.username}/edit`);
  };

  return (
    <header className="profile-header">
      <div className="cover-image-container">
        <img
          src={
            userProfile.coverImage
              ? publicUrl(userProfile.coverImage)
              : 'https://images.pexels.com/photos/1631677/pexels-photo-1631677.jpeg'
          }
          alt="Cover"
          className="cover-image"
        />
      </div>
      <div className="profile-info-bar">
        <div className="avatar-section">
          <img
            src={
              userProfile.avatar
                ? publicUrl(userProfile.avatar)
                : 'https://via.placeholder.com/150'
            }
            alt={userProfile.username}
            className="profile-avatar"
          />
          
         <div className="name-section">
  <h2>{userProfile.name || userProfile.username}</h2>
  <p>@{userProfile.username}</p>
<div className="user-level" style={{ color: levelInfo.color }}>
  <strong>
    {levelInfo.icon} {levelInfo.level}
  </strong>
  <p className="xp">
    {userProfile.xp} / {levelInfo.xpToNextLevel} XP
  </p>
  <p className="desc">{levelInfo.description}</p>
</div>


</div>

        </div>
        <div className="stats-section">
          <div className="stat">
            <strong>{userProfile.following.length}</strong>
            <span>Đang theo dõi</span>
          </div>
          <div className="stat">
            <strong>{userProfile.followers.length}</strong>
            <span>Người theo dõi</span>
          </div>
        </div>
        <div className="action-section">
          {isMyProfile ? (
            <Button onClick={handleEditProfile} variant="secondary">
              Chỉnh sửa hồ sơ
            </Button>
          ) : (
            <Button
              onClick={onFollowToggle}
              variant={isFollowing ? 'secondary' : 'primary'}
            >
              {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
            </Button>
          )}
        </div>
      </div>
      {userProfile.bio && (
        <p className="profile-bio">{userProfile.bio}</p>
      )}
    </header>
  );
};

export default ProfileHeader;
