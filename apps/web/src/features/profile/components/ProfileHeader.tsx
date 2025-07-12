import React from 'react';
import Button from '../../../components/common/Button';
import './ProfileHeader.scss';
import { useAuth } from '../../../features/auth/AuthContext';
import api from '../../../services/api';
import { useToast } from '../../../components/common/Toast/ToastContext';

// Định nghĩa đầy đủ interface UserProfile
export interface UserProfile {
  _id: string;
  username: string;
  avatar: string;
  coverImage: string;
  bio: string;
  followers: string[];
  following: string[];
}

interface ProfileHeaderProps { userProfile: UserProfile; }

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ userProfile }) => {
  const { user: currentUser, fetchUser } = useAuth();
  const { addToast } = useToast();

  // Kiểm tra xem user hiện tại có đang follow profile này không
  const isFollowing = currentUser?.following.includes(userProfile._id);

  const handleFollowToggle = async () => {
    const method = isFollowing ? 'delete' : 'post';

    try {
      await api[method](`/users/${userProfile._id}/follow`);
      addToast(`${isFollowing ? 'Bỏ theo dõi' : 'Theo dõi'} thành công!`, 'success');
      fetchUser(); // Cập nhật lại thông tin user để nút bấm thay đổi
      // (Nâng cao) Cần một cách để cập nhật lại profile đang xem
    } catch (error) {
      addToast('Đã có lỗi xảy ra', 'error');
    }
  };

  return (
    <header className="profile-header">
      {/* ... (Phần hiển thị thông tin giữ nguyên) */}
      <div className="profile-actions">
        {currentUser?._id !== userProfile._id && (
          <Button onClick={handleFollowToggle}>
            {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
          </Button>
        )}
      </div>
    </header>
  );
};

export default ProfileHeader;
