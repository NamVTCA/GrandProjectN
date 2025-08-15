import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import api from '../services/api';
import ProfileHeader from '../features/profile/components/ProfileHeader';
import UserPostList from '../features/profile/components/UserPostList';
import type { UserProfile } from '../features/profile/types/UserProfile';
import { useAuth } from '../features/auth/AuthContext';
import './ProfilePage.scss';

type LocationState = {
  updatedProfile?: UserProfile;
};

const ProfilePage: React.FC = () => {
  const { username: paramUsername } = useParams<{ username: string }>();
  const { state } = useLocation() as { state: LocationState };
  const { user: currentUser } = useAuth();

  const stateProfile = state?.updatedProfile;

  const [userProfile, setUserProfile] = useState<UserProfile | null>(
    stateProfile ?? null
  );
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(!stateProfile);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (stateProfile) {
      setIsFollowing(
        !!currentUser && stateProfile.followers.includes(currentUser._id)
      );
      return;
    }

    if (!paramUsername) {
      setError('Không xác định username.');
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get<UserProfile>(`/users/${paramUsername}`);
      setUserProfile(data);
      setIsFollowing(
        !!currentUser && data.followers.includes(currentUser._id)
      );
    } catch (err) {
      console.error(err);
      setError('Không tìm thấy người dùng hoặc có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  }, [paramUsername, currentUser, stateProfile]);

  useEffect(() => {
    if (!stateProfile) {
      fetchProfile();
    }
  }, [fetchProfile, stateProfile]);

  const handleFollowToggle = async () => {
    if (!userProfile || !currentUser) return;
    try {
      if (isFollowing) {
        await api.delete(`/users/${userProfile._id}/follow`);
        setUserProfile(prev =>
          prev
            ? {
                ...prev,
                followers: prev.followers.filter(id => id !== currentUser._id),
              }
            : prev
        );
      } else {
        await api.post(`/users/${userProfile._id}/follow`);
        setUserProfile(prev =>
          prev
            ? { ...prev, followers: [...prev.followers, currentUser._id] }
            : prev
        );
      }
      setIsFollowing(!isFollowing);
    } catch (err) {
      console.error('Lỗi khi (un)follow:', err);
    }
  };

  if (loading) return <div className="page-status">Đang tải hồ sơ...</div>;
  if (error) return <div className="page-status error">{error}</div>;
  if (!userProfile) return null;

  // Kiểm tra trạng thái tài khoản (thêm accountStatus vào UserProfile interface nếu chưa có)
  const isAccountSuspendedOrBanned = 
    (userProfile as any).accountStatus === 'SUSPENDED' || 
    (userProfile as any).accountStatus === 'BANNED';
  const isCurrentUserProfile = currentUser?._id === userProfile._id;

  if (isAccountSuspendedOrBanned && !isCurrentUserProfile) {
    return (
      <div className="page-status error">
        Tài khoản này hiện đang bị {(userProfile as any).accountStatus === 'SUSPENDED' ? 'tạm ngưng' : 'vô hiệu hóa'}
      </div>
    );
  }

  return (
    <div className="profile-page">
      <ProfileHeader
        userProfile={userProfile}
        isFollowing={isFollowing}
        onFollowToggle={handleFollowToggle}
      />
      <div className="profile-content">
        <UserPostList userId={userProfile._id} />
      </div>
    </div>
  );
};

export default ProfilePage;