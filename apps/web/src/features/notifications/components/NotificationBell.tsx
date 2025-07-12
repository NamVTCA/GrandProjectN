import React, { useEffect, useState } from 'react';
import { useSocket } from '../../../hooks/useSocket';
import { useAuth } from '../../auth/AuthContext';
import './NotificationBell.scss';

interface Notification {
  _id: string;
  sender: { username: string };
  type: string;
  metadata?: { gameName?: string };
}

const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const notificationSocket = useSocket('notifications');

  useEffect(() => {
    if (!notificationSocket || !user) return;

    notificationSocket.on('newNotification', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    return () => {
      notificationSocket.off('newNotification');
    };
  }, [notificationSocket, user]);

  const getNotificationMessage = (notif: Notification) => {
    switch (notif.type) {
      case 'NEW_LIKE': return `${notif.sender.username} đã thích bài viết của bạn.`;
      case 'NEW_COMMENT': return `${notif.sender.username} đã bình luận bài viết của bạn.`;
      case 'NEW_FOLLOWER': return `${notif.sender.username} đã bắt đầu theo dõi bạn.`;
      case 'GAME_INVITE': return `${notif.sender.username} đã mời bạn chơi ${notif.metadata?.gameName}.`;
      default: return 'Bạn có thông báo mới.';
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
              <div key={notif._id} className="notification-item">
                {getNotificationMessage(notif)}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
