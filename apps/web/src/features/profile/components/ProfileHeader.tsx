// File: src/features/profile/components/ProfileHeader.tsx (Không đổi)
import React from 'react';
import type { UserProfile } from '../types/UserProfile';
import { useAuth } from '../../auth/AuthContext';
import Button from '../../../components/common/Button';
import './ProfileHeader.scss';

interface ProfileHeaderProps {
  userProfile: UserProfile;
  isFollowing: boolean;
  onFollowToggle: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ userProfile, isFollowing, onFollowToggle }) => {
  const { user } = useAuth();
  const isMyProfile = user?._id === userProfile._id;

  const handleEditProfile = () => console.log('Edit Profile');

  return (
    <header className="profile-header">
      <div className="cover-image-container">
        <img 
          src={userProfile.coverImage || 'https://images.pexels.com/photos/1631677/pexels-photo-1631677.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'} 
          alt="Cover" 
          className="cover-image" 
        />
      </div>
      <div className="profile-info-bar">
        <div className="avatar-section">
          <img 
            src={userProfile.avatar || 'https://via.placeholder.com/150'} 
            alt={userProfile.username} 
            className="profile-avatar" 
          />
          <div className="name-section">
            <h2>{userProfile.name || userProfile.username}</h2>
            <p>@{userProfile.username}</p>
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
            <Button onClick={handleEditProfile} variant="secondary">Chỉnh sửa hồ sơ</Button>
          ) : (
            <Button onClick={onFollowToggle} variant={isFollowing ? 'secondary' : 'primary'}>
              {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
            </Button>
          )}
        </div>
      </div>
      {userProfile.bio && <p className="profile-bio">{userProfile.bio}</p>}
    </header>
  );
};
export default ProfileHeader;