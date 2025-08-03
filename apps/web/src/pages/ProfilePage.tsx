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
  // 1) param username từ URL
  const { username: paramUsername } = useParams<{ username: string }>();
  // 2) location.state khi navigate kèm updatedProfile
  const { state } = useLocation() as { state: LocationState };
  const { user: currentUser } = useAuth();

  // 3) stateProfile = state.updatedProfile nếu có
  const stateProfile = state?.updatedProfile;

  const [userProfile, setUserProfile] = useState<UserProfile | null>(
    stateProfile ?? null
  );
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(!stateProfile); // nếu có state thì ko loading
  const [error, setError] = useState<string | null>(null);

  // 4) fetch hoặc dùng stateProfile
  const fetchProfile = useCallback(async () => {
    // Nếu đã có stateProfile từ navigation, dùng ngay
    if (stateProfile) {
      setIsFollowing(
        !!currentUser && stateProfile.followers.includes(currentUser._id)
      );
      return;
    }

    // Nếu ko có paramUsername hoặc stateProfile, báo lỗi
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

  // 5) useEffect chỉ gọi fetch nếu chưa có stateProfile
  useEffect(() => {
    if (!stateProfile) {
      fetchProfile();
    }
  }, [fetchProfile, stateProfile]);

  // 6) Hàm follow/unfollow
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

  // 7) UI trạng thái
  if (loading) return <div className="page-status">Đang tải hồ sơ...</div>;
  if (error) return <div className="page-status error">{error}</div>;
  if (!userProfile) return null;

  // 8) Render chính
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
