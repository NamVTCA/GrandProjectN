import { useEffect, useState } from 'react';
import './NotificationsPage.scss';
import api from '../services/api';
import { TrashIcon } from 'lucide-react';
import moment from 'moment';
// ✨ added
import { publicUrl } from '../untils/publicUrl';

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
    // ✨ added
    avatarUrl?: string;
    // ✨ added
    profile?: { avatarUrl?: string };
  };
  metadata?: {
    gameName?: string;
    boxArtUrl?: string;
    reason?: string;
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
    // ✨ added
    avatarUrl?: string;
    // ✨ added
    profile?: { avatarUrl?: string };
  };
}
interface FriendRequest {
  _id: string;
  sender: {
    _id: string;
    username: string;
    avatar: string;
    // ✨ added
    avatarUrl?: string;
    // ✨ added
    profile?: { avatarUrl?: string };
  };
  status: string;
  createdAt: string;
}

// ✨ added
const AVATAR_FALLBACK = '/images/avatar-placeholder.png';
// ✨ added
const pickAvatar = (s?: { avatar?: string; avatarUrl?: string; profile?: { avatarUrl?: string } }) =>
  s?.avatar || s?.avatarUrl || s?.profile?.avatarUrl || '';
// ✨ added
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
    } catch (err) {
      console.error('Lỗi khi lấy lời mời kết bạn:', err);
    }
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications/all');
        setNotifications(res.data);
      } catch (err) {
        console.error('Lỗi khi lấy notifications:', err);
      }
    };

    const fetchWarnings = async () => {
      try {
        const res = await api.get('/users/warnings/get');
        const warningsAsNoti = res.data.map((warn: Warning) => ({
          _id: `warn-${warn._id}`,
          type: 'WARN',
          isRead: false, // Cảnh báo luôn được coi là chưa đọc cho đến khi xóa
          createdAt: warn.date,
          sender: {
            _id: warn.by?._id,
            username: warn.by?.username || 'Admin',
            avatar: pickAvatar(warn.by) || '/default_avatar.png',
          },
          metadata: { reason: warn.reason },
        }));
        setWarnings(warningsAsNoti);
      } catch (err) {
        console.error('Lỗi khi lấy cảnh cáo:', err);
      } finally {
        setLoading(false);
      }
    };
    const fetchAll = async () => {
      await Promise.all([fetchNotifications(), fetchWarnings(), fetchFriendRequests()]);
      setLoading(false);
    };

    fetchAll();
  }, []);

  // ✏️ changed (ACCEPT/REJECT thay vì ACCEPTED/REJECTED)
  const respondToFriendRequest = async (requestId: string, status: 'ACCEPT' | 'REJECT') => {
    try {
      await api.post(`/friends/response/${requestId}`, { status });
      setFriendRequests((prev) => prev.filter((req) => req._id !== requestId));
    } catch (err) {
      console.error('Lỗi khi xử lý lời mời:', err);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Lỗi khi đánh dấu đã đọc:', err);
    }
  };

  const renderMessage = (noti: Notification) => {
    switch (noti.type) {
      case 'FRIEND_REQUEST':
        return 'gửi lời mời kết bạn';
      case 'GROUP_INVITE':
        return `mời bạn vào nhóm`;
      case 'WARN':
        return `đã cảnh cáo bạn: "${noti.metadata?.reason}"`;
      default:
        return 'gửi thông báo';
    }
  };

  if (loading) return <p>Đang tải thông báo...</p>;

  return (
    <div className="notifications-page">
      {/* Phần Cảnh Báo */}
      <h2 className="section-title">Cảnh Báo Của Bạn</h2>
      {warnings.length === 0 ? (
        <p className="empty-message">Không có cảnh báo nào.</p>
      ) : (
        <ul className="notification-list">
          {warnings.map((warn) => (
            <li
              key={warn._id}
              className="notification-item warning-item"
            >
              <img
                src={asAvatar(pickAvatar(warn.sender))}
                alt={warn.sender?.username}
                // ✨ added
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = AVATAR_FALLBACK;
                }}
              />
              <div className="notification-content">
                <span>
                  <strong>{warn.sender?.username || 'Admin'}</strong> đã cảnh cáo bạn về: "{warn.metadata?.reason}"
                </span>
                <small>{moment(warn.createdAt).fromNow()}</small>
              </div>
              <button
                onClick={() => handleDeleteWarning(warn._id)}
                className="delete-btn"
                title="Xóa cảnh báo"
              >
                <TrashIcon size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <hr className="divider" />
      {/* Phần Lời Mời Kết Bạn */}
      <h2 className="section-title">Lời Mời Kết Bạn</h2>
      {friendRequests.length === 0 ? (
        <p className="empty-message">Không có lời mời nào.</p>
      ) : (
        <ul className="notification-list">
          {friendRequests.map((req) => (
            <li
              key={req._id}
              className="notification-item friend-request-item"
            >
              <img
                src={asAvatar(pickAvatar(req.sender))}
                alt={req.sender.username}
                // ✨ added
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = AVATAR_FALLBACK;
                }}
              />
              <div className="notification-content">
                <span>
                  <strong>{req.sender.username}</strong> đã gửi cho bạn lời mời kết bạn
                </span>
                <small>{moment(req.createdAt).fromNow()}</small>
              </div>
              <div className="action-buttons">
                <button onClick={() => respondToFriendRequest(req._id, 'ACCEPT')} className="accept-btn">Chấp nhận</button> {/* ✏️ changed */}
                <button onClick={() => respondToFriendRequest(req._id, 'REJECT')} className="reject-btn">Từ chối</button> {/* ✏️ changed */}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Phần Thông Báo */}
      <h2 className="section-title">Thông Báo</h2>
      {notifications.length === 0 ? (
        <p className="empty-message">Không có thông báo nào.</p>
      ) : (
        <ul className="notification-list">
          {notifications.map((noti) => (
            <li
              key={noti._id}
              className={`notification-item ${!noti.isRead ? 'unread' : 'read'}`}
              onClick={() => handleMarkAsRead(noti._id)}
            >
              <img
                src={asAvatar(pickAvatar(noti.sender))}
                alt={noti.sender?.username}
                // ✨ added
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = AVATAR_FALLBACK;
                }}
              />
              <div className="notification-content">
                <span>
                  <strong>{noti.sender?.username || 'Người dùng'}</strong> {renderMessage(noti)}
                </span>
                <small>{moment(noti.createdAt).fromNow()}</small>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  async function handleDeleteWarning(id: string) {
    const rawId = id.replace('warn-', '');
    try {
      await api.delete(`/users/warnings/delete/${rawId}`);
      setWarnings((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error('Lỗi khi xoá cảnh cáo:', err);
    }
  }
}
