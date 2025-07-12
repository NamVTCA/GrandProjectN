import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import ProfileHeader from '../features/profile/components/ProfileHeader';
import type { UserProfile } from '../features/profile/components/ProfileHeader';
// import UserPostList from '../features/profile/components/UserPostList';

const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (username) {
      api.get(`/users/${username}`)
        .then(response => setUserProfile(response.data))
        .catch(error => console.error("Lỗi khi tải profile:", error))
        .finally(() => setLoading(false));
    }
  }, [username]);

  if (loading) return <p>Đang tải trang cá nhân...</p>;
  if (!userProfile) return <p>Không tìm thấy người dùng.</p>;

  return (
    <div className="profile-page">
      <ProfileHeader userProfile={userProfile} />
      {/* Vùng hiển thị các bài đăng của người dùng */}
      {/* <UserPostList userId={userProfile._id} /> */}
    </div>
  );
};

export default ProfilePage;
