import { useEffect, useState } from 'react';
import './NotificationsPage.scss';
import api from '../services/api';
import { TrashIcon, CheckIcon, X } from 'lucide-react';
import moment from 'moment';
import { publicUrl } from '../untils/publicUrl';
import { acceptGroupInvite, declineGroupInvite } from '../services/group.api';
import { toast } from 'react-toastify';

moment.locale('vi');

interface Notification {
  _id: string;
  type: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
  sender: {
    _id: string;
    username: string;
    avatar: string;
    avatarUrl?: string;
    profile?: { avatarUrl?: string };
  };
  metadata?: {
    gameName?: string;
    boxArtUrl?: string;
    reason?: string;
    reportReason?: string;
    postContent?: string;
    groupName?: string;
    inviteId?: string;
    groupId?: string;
  };
}

interface Warning {
  _id: string;
  reason: string;
  date: string;
  by: {
    _id: string;
    username: string;
    avatar: string;
    avatarUrl?: string;
    profile?: { avatarUrl?: string };
  };
  reportDetails?: {
    reason: string;
    postContent?: string;
  };
}

type FriendRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

interface FriendRequest {
  _id: string;
  sender: {
    _id: string;
    username: string;
    avatar: string;
    avatarUrl?: string;
    profile?: { avatarUrl?: string };
  };
  status: FriendRequestStatus;
  createdAt: string;
}

const AVATAR_FALLBACK = '/images/avatar-placeholder.png';
const pickAvatar = (s?: { avatar?: string; avatarUrl?: string; profile?: { avatarUrl?: string } }) =>
  s?.avatar || s?.avatarUrl || s?.profile?.avatarUrl || '';
const asAvatar = (u?: string) => publicUrl(u) || AVATAR_FALLBACK;

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [warnings, setWarnings] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);

  const fetchFriendRequests = async () => {
    try {
      const res = await api.get('/friends/requests');
      setFriendRequests(res.data);
    } catch {
      toast.error('Lỗi khi lấy lời mời kết bạn');
    }
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications/all');
        setNotifications(res.data);
      } catch {
        toast.error('Lỗi khi lấy thông báo');
      }
    };

    const fetchWarnings = async () => {
      try {
        const res = await api.get('/users/warnings/get');
        const warningsAsNoti = res.data.map((warn: Warning) => ({
          _id: `warn-${warn._id}`,
          type: 'WARN',
          isRead: false,
          createdAt: warn.date,
          sender: {
            _id: warn.by?._id,
            username: warn.by?.username || 'Admin',
            avatar: pickAvatar(warn.by) || '/default_avatar.png',
          },
          metadata: {
            reason: warn.reason,
            reportReason: warn.reportDetails?.reason,
            postContent: warn.reportDetails?.postContent,
          },
        })) as Notification[];
        setWarnings(warningsAsNoti);
      } catch {
        toast.error('Lỗi khi lấy cảnh cáo');
      }
    };

    const fetchAll = async () => {
      await Promise.all([fetchNotifications(), fetchWarnings(), fetchFriendRequests()]);
      setLoading(false);
    };

    fetchAll();
  }, []);

  const respondToFriendRequest = async (requestId: string, action: 'ACCEPT' | 'REJECT') => {
    try {
      const map = { ACCEPT: 'ACCEPTED', REJECT: 'REJECTED' } as const;
      await api.post(`/friends/response/${requestId}`, { status: map[action] });
      setFriendRequests((prev) => prev.filter((req) => req._id !== requestId));
      toast.success(`Đã ${action === 'ACCEPT' ? 'chấp nhận' : 'từ chối'} lời mời kết bạn`);
    } catch {
      toast.error('Lỗi khi xử lý lời mời');
    }
  };

  // Xử lý lời mời tham gia nhóm
  const respondToGroupInvite = async (inviteId: string, action: 'ACCEPT' | 'DECLINE', notiId: string) => {
    try {
      if (action === 'ACCEPT') {
        await acceptGroupInvite(inviteId);
        toast.success('Đã tham gia nhóm');
      } else {
        await declineGroupInvite(inviteId);
        toast.info('Đã từ chối lời mời nhóm');
      }
      setNotifications((prev) => prev.filter((n) => n._id !== notiId));
    } catch (err) {
      console.error('Lỗi khi xử lý lời mời nhóm:', err);
      toast.error('Lỗi khi xử lý lời mời nhóm');
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch {
      toast.error('Lỗi khi đánh dấu đã đọc');
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      toast.success('Đã xóa thông báo');
    } catch {
      toast.error('Lỗi khi xóa thông báo');
    }
  };

  const handleDeleteWarning = async (id: string) => {
    const rawId = id.replace('warn-', '');
    try {
      await api.delete(`/users/warnings/delete/${rawId}`);
      setWarnings((prev) => prev.filter((n) => n._id !== id));
      toast.success('Đã xóa cảnh báo');
    } catch {
      toast.error('Lỗi khi xoá cảnh cáo');
    }
  };

  const handleClearAll = async (type: 'notifications' | 'warnings' | 'friendRequests') => {
    try {
      if (type === 'notifications') {
        await api.delete('/notifications/clear');
        setNotifications([]);
      } else if (type === 'warnings') {
        await api.delete('/users/warnings/clear');
        setWarnings([]);
      } else if (type === 'friendRequests') {
        await api.delete('/friends/requests/clear');
        setFriendRequests([]);
      }
      toast.success(
        `Đã xóa tất cả ${
          type === 'notifications' ? 'thông báo' : type === 'warnings' ? 'cảnh báo' : 'lời mời kết bạn'
        }`,
      );
    } catch {
      toast.error(`Lỗi khi xóa tất cả ${type}`);
    }
  };

  const renderNotificationMessage = (noti: Notification) => {
    const senderName = noti.sender?.username || 'Người dùng';
    switch (noti.type) {
      case 'NEW_REACTION':
        return `${senderName} đã bày tỏ cảm xúc với bài viết của bạn`;
      case 'NEW_COMMENT':
        return `${senderName} đã bình luận về bài viết của bạn`;
      case 'NEW_FOLLOWER':
        return `${senderName} đã bắt đầu theo dõi bạn`;
      case 'FRIEND_REQUEST':
        return `${senderName} đã gửi lời mời kết bạn`;
      case 'FRIEND_ACCEPTED':
        return `${senderName} đã chấp nhận lời mời kết bạn của bạn`;
      case 'GAME_INVITE':
        return `${senderName} đã mời bạn chơi ${noti.metadata?.gameName || 'một trò chơi'}`;
      case 'GROUP_INVITE':
        return `${senderName} đã mời bạn tham gia nhóm ${noti.metadata?.groupName || ''}`;
      case 'GROUP_REQUEST_ACCEPTED':
        return `Yêu cầu tham gia nhóm của bạn đã được chấp nhận`;
      case 'GROUP_REQUEST_REJECTED':
        return `Yêu cầu tham gia nhóm của bạn đã bị từ chối`;
      case 'POST_DELETED_BY_ADMIN':
        return `Bài viết của bạn đã bị xóa bởi quản trị viên`;
      case 'WARN':
        return `${senderName} đã cảnh cáo bạn`;
      default:
        return `${senderName} đã gửi cho bạn một thông báo`;
    }
  };

  const renderNotificationReason = (noti: Notification) => {
    if (!noti.metadata?.reason && !noti.metadata?.reportReason) return null;
    return (
      <div className="notification-reason">
        {noti.metadata?.reason && (
          <div>
            <strong>Lý do:</strong> {noti.metadata.reason}
          </div>
        )}
        {noti.metadata?.reportReason && (
          <div>
            <strong>Nguyên nhân báo cáo:</strong> {noti.metadata.reportReason}
          </div>
        )}
      </div>
    );
  };

  const renderWarningDetails = (noti: Notification) => (
    <div className="warning-details">
      {noti.metadata?.reportReason && (
        <div className="detail-item">
          <strong>Nguyên nhân báo cáo:</strong> {noti.metadata.reportReason}
        </div>
      )}
      {noti.metadata?.postContent && (
        <div className="detail-item">
          <strong>Nội dung bài viết:</strong>
          <div className="post-content-preview">{noti.metadata.postContent}</div>
        </div>
      )}
      {noti.metadata?.reason && (
        <div className="detail-item">
          <strong>Lý do cảnh cáo:</strong> {noti.metadata.reason}
        </div>
      )}
    </div>
  );

  if (loading) return <div className="notifications-page"><p>Đang tải thông báo...</p></div>;

  return (
    <div className="notifications-page">
      {/* Cảnh báo */}
      <div className="section-container">
        <h2 className="section-title">
          Cảnh Báo Của Bạn
          {warnings.length > 0 && (
            <span className="clear-all" onClick={() => handleClearAll('warnings')}>
              Xóa tất cả
            </span>
          )}
        </h2>
        {warnings.length === 0 ? (
          <p className="empty-message">Không có cảnh báo nào.</p>
        ) : (
          <ul className="notification-list">
            {warnings.map((warn) => (
              <li key={warn._id} className="notification-item warning-item">
                <img
                  src={asAvatar(pickAvatar(warn.sender))}
                  alt={warn.sender?.username}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = AVATAR_FALLBACK;
                  }}
                />
                <div className="notification-content">
                  <span className="notification-text">{renderNotificationMessage(warn)}</span>
                  {renderWarningDetails(warn)}
                  <span className="notification-time">{moment(warn.createdAt).fromNow()}</span>
                </div>
                <div className="notification-actions">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteWarning(warn._id);
                    }}
                    title="Xóa cảnh báo"
                  >
                    <TrashIcon size={18} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Lời mời kết bạn */}
      <div className="section-container">
        <h2 className="section-title">
          Lời Mời Kết Bạn
          {friendRequests.length > 0 && (
            <span className="clear-all" onClick={() => handleClearAll('friendRequests')}>
              Xóa tất cả
            </span>
          )}
        </h2>
        {friendRequests.length === 0 ? (
          <p className="empty-message">Không có lời mời nào.</p>
        ) : (
          <ul className="notification-list">
            {friendRequests.map((req) => (
              <li key={req._id} className="notification-item">
                <img
                  src={asAvatar(pickAvatar(req.sender))}
                  alt={req.sender.username}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = AVATAR_FALLBACK;
                  }}
                />
                <div className="notification-content">
                  <span className="notification-text">
                    <strong>{req.sender.username}</strong> đã gửi cho bạn lời mời kết bạn
                  </span>
                  <span className="notification-time">{moment(req.createdAt).fromNow()}</span>
                </div>
                <div className="action-buttons">
                  <button
                    onClick={() => respondToFriendRequest(req._id, 'ACCEPT')}
                    className="accept-btn"
                    title="Chấp nhận"
                  >
                    <CheckIcon size={16} />
                  </button>
                  <button
                    onClick={() => respondToFriendRequest(req._id, 'REJECT')}
                    className="reject-btn"
                    title="Từ chối"
                  >
                    <X size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Thông báo */}
      <div className="section-container">
        <h2 className="section-title">
          Thông Báo
          {notifications.length > 0 && (
            <span className="clear-all" onClick={() => handleClearAll('notifications')}>
              Xóa tất cả
            </span>
          )}
        </h2>
        {notifications.length === 0 ? (
          <p className="empty-message">Không có thông báo nào.</p>
        ) : (
          <ul className="notification-list">
            {notifications.map((noti) => (
              <li
                key={noti._id}
                className={`notification-item ${!noti.isRead ? 'unread' : ''}`}
                onClick={() => handleMarkAsRead(noti._id)}
              >
                <img
                  src={asAvatar(pickAvatar(noti.sender))}
                  alt={noti.sender?.username}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = AVATAR_FALLBACK;
                  }}
                />
                <div className="notification-content">
                  <span className="notification-text">{renderNotificationMessage(noti)}</span>
                  {renderNotificationReason(noti)}
                  <span className="notification-time">{moment(noti.createdAt).fromNow()}</span>

                  {/* Nút Tham gia/Từ chối cho lời mời nhóm */}
                  {noti.type === 'GROUP_INVITE' && noti.metadata?.inviteId && (
                    <div className="action-buttons">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          respondToGroupInvite(noti.metadata!.inviteId!, 'ACCEPT', noti._id);
                        }}
                        className="accept-btn"
                        title="Tham gia"
                      >
                        <CheckIcon size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          respondToGroupInvite(noti.metadata!.inviteId!, 'DECLINE', noti._id);
                        }}
                        className="reject-btn"
                        title="Từ chối"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}

                  {/* Fallback nếu chưa có inviteId */}
                  {noti.type === 'GROUP_INVITE' && !noti.metadata?.inviteId && (
                    <div className="action-buttons">
                      <a className="accept-btn" href={noti.link || '/group-invites'}>
                        Xem lời mời
                      </a>
                    </div>
                  )}
                </div>
                <div className="notification-actions">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNotification(noti._id);
                    }}
                    title="Xóa thông báo"
                  >
                    <TrashIcon size={18} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
