import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { UserProfile } from "../types/UserProfile";
import { useAuth } from "../../auth/AuthContext";
import Button from "../../../components/common/Button";
import "./ProfileHeader.scss";
import { publicUrl } from "../../../untils/publicUrl";
import api from "../../../services/api";

// --- Modal báo cáo ---
const ReportModal: React.FC<{
  onClose: () => void;
  onSubmit: (reason: string) => void;
}> = ({ onClose, onSubmit }) => {
  const [reason, setReason] = useState("");
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content report-modal" onClick={(e) => e.stopPropagation()}>
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
  xpToNextLevel: number;
};

const getUserLevelInfo = (xp: number): UserLevelInfo => {
  if (xp >= 20000)
    return { level: "Bậc thầy mạng xã hội", description: "Biểu tượng trong cộng đồng", color: "#6f42c1", icon: "🪐", xpToNextLevel: 30000 };
  if (xp >= 10000)
    return { level: "Người nổi tiếng", description: "Có tiếng nói trong cộng đồng", color: "#d63384", icon: "🌟", xpToNextLevel: 20000 };
  if (xp >= 5000)
    return { level: "Lão làng", description: "Được cộng đồng quan tâm", color: "#20c997", xpToNextLevel: 10000 };
  if (xp >= 2000)
    return { level: "Cựu thành viên", description: "Tạo ảnh hưởng nhỏ", color: "#17a2b8", xpToNextLevel: 5000 };
  if (xp >= 500)
    return { level: "GenZ", description: "Có tương tác thường xuyên", color: "#fd7e14", xpToNextLevel: 2000 };
  return { level: "Mới dùng mạng xã hội", description: "Vừa tham gia", color: "#6c757d", xpToNextLevel: 500 };
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

  const [isReportModalOpen, setReportModalOpen] = useState(false);

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
              : "https://images.pexels.com/photos/1631677/pexels-photo-1631677.jpeg"
          }
          alt="Cover"
          className="cover-image"
        />
      </div>

      <div className="profile-info-bar">
        <div className="avatar-section">
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
</div>

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
            <Button onClick={handleEditProfile} variant="secondary" size="small">
              Chỉnh sửa hồ sơ
            </Button>
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
