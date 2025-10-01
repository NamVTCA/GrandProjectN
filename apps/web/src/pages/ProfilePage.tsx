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

type FriendshipStatus = 'FRIENDS' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'NONE';

// Chuẩn hoá id
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
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>('NONE');
  const [isProcessing, setIsProcessing] = useState(false);

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
    if (!paramUsername) {
      setError('Không xác định username.');
      setLoading(false);
      return;
    }

    try {
      let data: UserProfile;

      // Ưu tiên lấy theo username
      try {
        const res = await api.get<UserProfile>(`/users/${encodeURIComponent(paramUsername)}`);
        data = res.data;
      } catch (errFirst) {
        if (/^[a-f\d]{24}$/i.test(String(paramUsername))) {
          const res = await api.get<UserProfile>(`/users/by-id/${paramUsername}`);
          data = res.data;
        } else {
          throw errFirst;
        }
      }

      setUserProfile(data);
      setIsFollowing(computeIsFollowing(data));

      // ✅ Lấy trạng thái bạn bè
      if (currentUser && data._id !== currentUser._id) {
        try {
          const resFriend = await api.get(`/friends/status/${data._id}`);
          const friendData = resFriend.data as { status: FriendshipStatus };
          setFriendshipStatus(friendData.status);
        } catch (err) {
          console.warn('Không lấy được trạng thái bạn bè', err);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Không tìm thấy người dùng hoặc có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  }, [paramUsername, currentUser, computeIsFollowing]);

  useEffect(() => {
    if (!stateProfile) {
      fetchProfile();
    }
  }, [fetchProfile, stateProfile]);

  // follow toggle
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

  // ✅ Friend actions
  const handleAddFriend = async () => {
    if (!userProfile) return;
    setIsProcessing(true);
    try {
      await api.post(`/friends/request/${userProfile._id}`);
      setFriendshipStatus('REQUEST_SENT');
      toast.success('Đã gửi lời mời kết bạn');
    } catch {
      toast.error('Lỗi khi gửi lời mời');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcceptFriend = async () => {
    if (!userProfile) return;
    setIsProcessing(true);
    try {
      await api.post(`/friends/accept/${userProfile._id}`);
      setFriendshipStatus('FRIENDS');
      toast.success('Đã chấp nhận kết bạn');
    } catch {
      toast.error('Lỗi khi chấp nhận lời mời');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnfriend = async () => {
    if (!userProfile) return;
    setIsProcessing(true);
    try {
      await api.delete(`/friends/${userProfile._id}`);
      setFriendshipStatus('NONE');
      toast.success('Đã hủy kết bạn');
    } catch {
      toast.error('Lỗi khi hủy kết bạn');
    } finally {
      setIsProcessing(false);
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
        friendshipStatus={friendshipStatus}
        onAddFriend={handleAddFriend}
        onAcceptFriend={handleAcceptFriend}
        onUnfriend={handleUnfriend}
        isProcessing={isProcessing}
      />
      <div className="profile-content">
        <UserPostList userId={String(userProfile._id)} />
      </div>
    </div>
  );
};

export default ProfilePage;
