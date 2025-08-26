// File: src/pages/ProfilePage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import api from '../services/api';
import ProfileHeader from '../features/profile/components/ProfileHeader';
import UserPostList from '../features/profile/components/UserPostList';
import type { UserProfile } from '../features/profile/types/UserProfile';
import { useAuth } from '../features/auth/AuthContext';
import './ProfilePage.scss';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type LocationState = {
  updatedProfile?: UserProfile;
};

// Helper chuẩn hoá mảng id (string | ObjectId | {_id})
const normIds = (arr: any): string[] =>
  Array.isArray(arr)
    ? arr
        .map((x: any) => {
          if (!x) return '';
          if (typeof x === 'string' || typeof x === 'number') return String(x);
          if (typeof x === 'object') return String(x._id ?? x.id ?? '');
          return '';
        })
        .filter(Boolean)
    : [];

const ProfilePage: React.FC = () => {
  const { username: paramUsername } = useParams<{ username: string }>();
  const { state } = useLocation() as { state: LocationState };
  const { user: currentUser } = useAuth();

  const stateProfile = state?.updatedProfile ?? null;

  const [userProfile, setUserProfile] = useState<UserProfile | null>(stateProfile);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(!stateProfile);
  const [error, setError] = useState<string | null>(null);

  const computeIsFollowing = useCallback(
    (profile: any) => {
      const myId = currentUser?._id ? String(currentUser._id) : '';
      const followers = normIds(profile?.followers);
      return !!myId && followers.includes(myId);
    },
    [currentUser]
  );

  const fetchProfile = useCallback(async () => {
    // Nếu có profile từ state (vừa chỉnh sửa xong quay lại)
    if (stateProfile) {
      setUserProfile(stateProfile);
      setIsFollowing(computeIsFollowing(stateProfile));
      setLoading(false);
      return;
    }

    if (!paramUsername) {
      setError('Không xác định username.');
      setLoading(false);
      return;
    }

    try {
      // Ưu tiên lấy theo username
      const { data } = await api.get<UserProfile>(`/users/${encodeURIComponent(paramUsername)}`);
      setUserProfile(data);
      setIsFollowing(computeIsFollowing(data));
    } catch (errFirst) {
      // Fallback: nếu param là ObjectId thì thử by-id
      try {
        if (/^[a-f\d]{24}$/i.test(String(paramUsername))) {
          const { data } = await api.get<UserProfile>(`/users/by-id/${paramUsername}`);
          setUserProfile(data);
          setIsFollowing(computeIsFollowing(data));
        } else {
          throw errFirst;
        }
      } catch (err) {
        console.error(err);
        setError('Không tìm thấy người dùng hoặc có lỗi xảy ra.');
      } finally {
        setLoading(false);
      }
    }
  }, [paramUsername, stateProfile, computeIsFollowing]);

  useEffect(() => {
    if (!stateProfile) {
      fetchProfile();
    }
  }, [fetchProfile, stateProfile]);

  const handleFollowToggle = async () => {
    if (!userProfile || !currentUser) return;
    const myId = String(currentUser._id);
    try {
      if (isFollowing) {
        await api.delete(`/users/${userProfile._id}/follow`);
        setUserProfile(prev =>
          prev ? { ...prev, followers: normIds(prev.followers).filter(id => id !== myId) as any } : prev
        );
        toast.success(`Đã bỏ theo dõi ${userProfile.username}`);
      } else {
        await api.post(`/users/${userProfile._id}/follow`);
        setUserProfile(prev =>
          prev ? { ...prev, followers: [...normIds(prev.followers), myId] as any } : prev
        );
        toast.success(`Đã theo dõi ${userProfile.username}`);
      }
      setIsFollowing(!isFollowing);
    } catch {
      toast.error('Lỗi khi thực hiện thao tác');
    }
  };

  if (loading) return <div className="page-status">Đang tải hồ sơ...</div>;
  if (error) return <div className="page-status error">{error}</div>;
  if (!userProfile) return null;

  // Kiểm tra trạng thái tài khoản (nếu có)
  const status = (userProfile as any).accountStatus;
  const isAccountSuspendedOrBanned = status === 'SUSPENDED' || status === 'BANNED';
  const isCurrentUserProfile = String(currentUser?._id ?? '') === String(userProfile._id ?? '');

  if (isAccountSuspendedOrBanned && !isCurrentUserProfile) {
    return (
      <div className="page-status error">
        Tài khoản này hiện đang bị {status === 'SUSPENDED' ? 'tạm ngưng' : 'vô hiệu hóa'}
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
        <UserPostList userId={String(userProfile._id)} />
      </div>
    </div>
  );
};

export default ProfilePage;
