// File: src/pages/ProfilePage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import ProfileHeader from '../features/profile/components/ProfileHeader';
import UserPostList from '../features/profile/components/UserPostList';
import  type { UserProfile } from '../features/profile/types/UserProfile';
import { useAuth } from '../features/auth/AuthContext';
import './ProfilePage.scss';

const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth(); // Lấy thông tin người dùng đang đăng nhập

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/users/${username}`);
      const profileData: UserProfile = response.data;
      setUserProfile(profileData);
      // Kiểm tra xem người dùng hiện tại có đang theo dõi hồ sơ này không
      if (currentUser && profileData.followers.includes(currentUser._id)) {
        setIsFollowing(true);
      }
    } catch (err) {
      setError('Không tìm thấy người dùng hoặc đã có lỗi xảy ra.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [username, currentUser]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleFollowToggle = async () => {
    if (!userProfile) return;

    try {
      if (isFollowing) {
        // --- Logic Bỏ theo dõi ---
        await api.delete(`/users/${userProfile._id}/follow`);
        // Cập nhật UI một cách lạc quan (optimistic update)
        setUserProfile(prev => prev ? { ...prev, followers: prev.followers.filter(id => id !== currentUser?._id) } : null);
      } else {
        // --- Logic Theo dõi ---
        await api.post(`/users/${userProfile._id}/follow`);
        // Cập nhật UI một cách lạc quan
        setUserProfile(prev => prev ? { ...prev, followers: [...prev.followers, currentUser!._id] } : null);
      }
      setIsFollowing(prev => !prev);
    } catch (error) {
      console.error("Lỗi khi thực hiện theo dõi/bỏ theo dõi:", error);
    }
  };

  if (loading) return <div className="page-status">Đang tải hồ sơ...</div>;
  if (error) return <div className="page-status error">{error}</div>;
  if (!userProfile) return null;

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