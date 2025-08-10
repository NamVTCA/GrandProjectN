import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { GroupDetail } from '../types/Group';
import Button from '../../../components/common/Button';
import { FaCog, FaSignInAlt, FaSignOutAlt } from 'react-icons/fa';
import CoverAvatarEditMenu from './CoverAvatarEditMenu';
import { toAssetUrl } from '../../../untils/img';
import './GroupHeader.scss';

type GroupHeaderProps = {
  group: GroupDetail;
  isOwner: boolean;
  isMember: boolean;
  isProcessing: boolean;
  joinStatus: 'MEMBER' | 'PENDING' | 'NONE';
  onJoinLeaveClick: () => void;
  /** Dùng lại header cho trang tạo nhóm */
  mode?: 'detail' | 'create';
};

const GroupHeader: React.FC<GroupHeaderProps> = ({
  group,
  isMember,
  isOwner,
  onJoinLeaveClick,
  isProcessing,
  joinStatus,
  mode = 'detail',
}) => {
  const [coverImage, setCoverImage] = useState<string | undefined>(group.coverImage);
  const [avatar, setAvatar] = useState<string | undefined>(group.avatar);

  // đồng bộ khi group thay đổi
  useEffect(() => {
    setCoverImage(group.coverImage);
    setAvatar(group.avatar);
  }, [group._id, group.coverImage, group.avatar]);

  const renderActionButton = () => {
    if (mode === 'create') return null; // Trang tạo: không hiển thị nút

    if (isOwner) {
      return (
        <Link to={`/groups/${group._id}/manage`}>
          <Button variant="secondary" disabled={isProcessing}>
            <FaCog /> Quản lý nhóm
          </Button>
        </Link>
      );
    }

    if (joinStatus === 'MEMBER') {
      return (
        <Button onClick={onJoinLeaveClick} disabled={isProcessing} variant="secondary">
          {isProcessing ? 'Đang xử lý...' : (<><FaSignOutAlt /> Rời khỏi nhóm</>)}
        </Button>
      );
    }

    if (joinStatus === 'PENDING') {
      return <Button disabled variant="secondary">Đang chờ phê duyệt</Button>;
    }

    return (
      <Button onClick={onJoinLeaveClick} disabled={isProcessing} variant="primary">
        {isProcessing ? 'Đang xử lý...' : (<><FaSignInAlt /> Tham gia nhóm</>)}
      </Button>
    );
  };

  return (
    <header className="group-header">
      <div
        className="group-cover-photo"
        style={{
          backgroundImage: `url(${coverImage ? toAssetUrl(coverImage) : 'https://placehold.co/1200x400/2a2a2a/404040?text=Cover'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {mode !== 'create' && isOwner && (
          <div className="cover-edit-slot">
            <CoverAvatarEditMenu
              groupId={group._id}
              onCoverUploaded={(url) => setCoverImage(url)}
              onAvatarUploaded={(url) => setAvatar(url)}
            />
          </div>
        )}

        <div className="group-info-container">
          <div className="group-avatar">
            <img
              src={avatar ? toAssetUrl(avatar) : 'https://placehold.co/150x150/2a2a2a/ffffff?text=G'}
              alt={`${group.name} avatar`}
            />
          </div>

          <div className="group-details">
            <h1>{group.name}</h1>
            <p>
              {group.privacy === 'public' ? 'Công khai' : 'Riêng tư'}
              {' • '}
              {group.memberCount} thành viên
            </p>
          </div>

          <div className="group-actions">{renderActionButton()}</div>
        </div>
      </div>
    </header>
  );
};

export default GroupHeader;
