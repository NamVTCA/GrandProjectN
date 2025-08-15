import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { UserProfile } from "../types/UserProfile";
import { useAuth } from "../../auth/AuthContext";
import Button from "../../../components/common/Button";
import "./ProfileHeader.scss";
import { publicUrl } from "../../../untils/publicUrl";
import api from "../../../services/api";
import AvatarWithFrame from "../../../components/common/AvatarWithFrame";

const ReportModal: React.FC<{
  onClose: () => void;
  onSubmit: (reason: string) => void;
}> = ({ onClose, onSubmit }) => {
  const [reason, setReason] = useState("");
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content report-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>🚩 Gửi báo cáo</h3>
        <textarea
          placeholder="Nhập lý do bạn muốn báo cáo..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="modal-actions">
          <button onClick={onClose}>Hủy</button>
          <button
            onClick={() => {
              if (!reason.trim()) {
                alert("Vui lòng nhập lý do báo cáo.");
                return;
              }
              onSubmit(reason);
            }}
          >
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
};

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
  xpToNextLevel: number | string;
};

const getUserLevelInfo = (xp: number, isAdmin: boolean): UserLevelInfo => {
  if (isAdmin) {
    return {
      level: "Chúa trời",
      description: "Quản trị viên tối cao",
      color: "#ff0000",
      icon: "👑",
      xpToNextLevel: "∞",
    };
  }

  if (xp >= 20000)
    return {
      level: "Bậc thầy mạng xã hội",
      description: "Biểu tượng trong cộng đồng",
      color: "#6f42c1",
      icon: "🪐",
      xpToNextLevel: 30000,
    };
  if (xp >= 10000)
    return {
      level: "Người nổi tiếng",
      description: "Có tiếng nói trong cộng đồng",
      color: "#d63384",
      icon: "🌟",
      xpToNextLevel: 20000,
    };
  if (xp >= 5000)
    return {
      level: "Lão làng",
      description: "Được cộng đồng quan tâm",
      color: "#20c997",
      xpToNextLevel: 10000,
    };
  if (xp >= 2000)
    return {
      level: "Cựu thành viên",
      description: "Tạo ảnh hưởng nhỏ",
      color: "#17a2b8",
      xpToNextLevel: 5000,
    };
  if (xp >= 500)
    return {
      level: "GenZ",
      description: "Có tương tác thường xuyên",
      color: "#fd7e14",
      xpToNextLevel: 2000,
    };
  return {
    level: "Mới dùng mạng xã hội",
    description: "Vừa tham gia",
    color: "#6c757d",
    xpToNextLevel: 500,
  };
};

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  userProfile,
  isFollowing,
  onFollowToggle,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMyProfile = user?._id === userProfile._id;
  const isAdmin = userProfile.globalRole === "ADMIN";
  const levelInfo = getUserLevelInfo(userProfile.xp, isAdmin);

  const [isReportModalOpen, setReportModalOpen] = useState(false);

  const handleEditProfile = () => {
    navigate(`/profile/${userProfile.username}/edit`);
  };

  const handleGoToAdminDashboard = () => {
    navigate("/admin/dashboard");
  };

  // Kiểm tra trạng thái tài khoản
  const isAccountSuspendedOrBanned = 
    userProfile.accountStatus === 'SUSPENDED' || 
    userProfile.accountStatus === 'BANNED';

  if (isAccountSuspendedOrBanned && !isMyProfile) {
    return null; // Đã xử lý hiển thị thông báo ở ProfilePage
  }

  return (
    <header className="profile-header">
      <div className="cover-image-container">
        <img
          src={
            userProfile.coverImage
              ? publicUrl(userProfile.coverImage)
              : "https://images.pexels.com/photos/1631677/pexels-photo-1631677.jpeg"
          }
          alt="Cover"
          className="cover-image"
        />
      </div>

      <div className="profile-info-bar">
        <div className="avatar-section">
          <div className="profile-avatar">
            <AvatarWithFrame
              avatarUrl={
                userProfile.avatar
                  ? publicUrl(userProfile.avatar)
                  : "https://via.placeholder.com/150"
              }
              frameAssetUrl={userProfile.equippedAvatarFrame?.assetUrl}
              size={96}
            />
          </div>

          <div className="name-section">
            <h2>{userProfile.name || userProfile.username}</h2>
            <p>@{userProfile.username}</p>
          </div>

          <div className="user-level" style={{ color: levelInfo.color }}>
            <strong>
              {levelInfo.icon} {levelInfo.level}
            </strong>
            <p className="xp">
              {isAdmin ? "∞" : userProfile.xp} / {levelInfo.xpToNextLevel} XP
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
          <div className="profile-actions">
            <Button onClick={handleEditProfile} variant="secondary" size="small">
              Chỉnh sửa hồ sơ
            </Button>
            {isAdmin && (
              <Button 
                onClick={handleGoToAdminDashboard} 
                variant="primary" 
                size="small"
                className="admin-dashboard-btn"
              >
                Trang quản trị
              </Button>
            )}
          </div>
        ) : (
          <>
            <Button
              onClick={onFollowToggle}
              variant={isFollowing ? "secondary" : "primary"}
              size="small"
            >
              {isFollowing ? "Đang theo dõi" : "Theo dõi"}
            </Button>
            <button
              className="report-btn"
              onClick={() => setReportModalOpen(true)}
            >
              🚩 Báo cáo
            </button>
          </>
        )}
      </div>

      {userProfile.bio && <p className="profile-bio">{userProfile.bio}</p>}

      {isReportModalOpen && (
        <ReportModal
          onClose={() => setReportModalOpen(false)}
          onSubmit={async (reason) => {
            await api.post("/reports", {
              type: "USER",
              targetId: userProfile._id,
              reason,
            });
            alert("✅ Cảm ơn bạn đã báo cáo người dùng này.");
            setReportModalOpen(false);
          }}
        />
      )}
    </header>
  );
};

export default ProfileHeader;