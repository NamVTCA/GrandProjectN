import React, { useEffect, useState } from 'react';
import { useSocket } from '../../../hooks/useSocket';
import { useAuth } from '../../auth/AuthContext';
import { acceptGroupInvite, declineGroupInvite } from '../../../services/group.api';
import './NotificationBell.scss';

interface Notification {
  _id: string;
  sender?: { username?: string; fullName?: string; avatar?: string };
  type: string;
  metadata?: { gameName?: string; inviteId?: string; groupId?: string };
  createdAt?: string;
}

const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const notificationSocket = useSocket('notifications');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!notificationSocket || !user) return;

    notificationSocket.on('newNotification', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    return () => {
      notificationSocket.off('newNotification');
    };
  }, [notificationSocket, user]);

  const handleAccept = async (notif: Notification) => {
    if (!notif.metadata?.inviteId) return;
    try {
      await acceptGroupInvite(notif.metadata.inviteId);
      setNotifications(prev => prev.filter(n => n._id !== notif._id));
    } catch {}
  };

  const handleDecline = async (notif: Notification) => {
    if (!notif.metadata?.inviteId) return;
    try {
      await declineGroupInvite(notif.metadata.inviteId);
      setNotifications(prev => prev.filter(n => n._id !== notif._id));
    } catch {}
  };

  const renderItem = (notif: Notification) => {
    if (notif.type === 'GROUP_INVITE') {
      const inviter = notif.sender?.username || notif.sender?.fullName || 'Ai đó';
      const groupLink = notif.metadata?.groupId ? `/groups/${notif.metadata.groupId}` : '#';
      return (
        <div className="notification-item">
          <div className="line">
            {inviter} đã mời bạn tham gia nhóm. <a href={groupLink}>Xem nhóm</a>
          </div>
          <div className="actions">
            <button className="btn-accept" onClick={() => handleAccept(notif)}>Tham gia</button>
            <button className="btn-decline" onClick={() => handleDecline(notif)}>Từ chối</button>
          </div>
        </div>
      );
    }

    // fallback messages cũ
    switch (notif.type) {
      case 'NEW_LIKE': return <div className="notification-item">{notif.sender?.username} đã thích bài viết của bạn.</div>;
      case 'NEW_COMMENT': return <div className="notification-item">{notif.sender?.username} đã bình luận bài viết của bạn.</div>;
      case 'NEW_FOLLOWER': return <div className="notification-item">{notif.sender?.username} đã bắt đầu theo dõi bạn.</div>;
      case 'GAME_INVITE': return <div className="notification-item">{notif.sender?.username} đã mời bạn chơi {notif.metadata?.gameName}.</div>;
      default: return <div className="notification-item">Bạn có thông báo mới.</div>;
    }
  };

  return (
    <div className="notification-bell">
      <button onClick={() => setIsOpen(!isOpen)}>
        🔔
        {notifications.length > 0 && <span className="badge">{notifications.length}</span>}
      </button>
      {isOpen && (
        <div className="notification-dropdown">
          {notifications.length === 0 ? (
            <div className="notification-item">Không có thông báo mới.</div>
          ) : (
            notifications.map(notif => (
              <div key={notif._id}>
                {renderItem(notif)}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
