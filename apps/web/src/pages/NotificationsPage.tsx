import React, { useEffect, useState } from 'react';
import './NotificationsPage.scss';
import api from '../services/api';

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
  };
  metadata?: {
    gameName?: string;
    boxArtUrl?: string;
  };
}

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications/all');
        setNotifications(res.data);
      } catch (err) {
        console.error('Lỗi khi lấy notifications:', err);
      }
    };
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (noti: Notification) => {
    try {
      if (!noti.isRead) {
        await api.patch(`/notifications/${noti._id}/read`);
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === noti._id ? { ...n, isRead: true } : n
          )
        );
      }
      // Nếu có link thì chuyển trang
      if (noti.link) {
        window.location.href = noti.link;
      }
    } catch (err) {
      console.error('Lỗi khi đánh dấu đã đọc:', err);
    }
  };

  const renderContent = (noti: Notification) => {
    switch (noti.type) {
      case 'NEW_LIKE':
        return `${noti.sender.username} đã thích bài viết của bạn.`;
      case 'NEW_COMMENT':
        return `${noti.sender.username} đã bình luận bài viết của bạn.`;
      case 'NEW_FOLLOWER':
        return `${noti.sender.username} đã theo dõi bạn.`;
      case 'GAME_INVITE':
        return `${noti.sender.username} mời bạn chơi ${noti.metadata?.gameName || 'một trò chơi'}.`;
      case 'NEW_REACTION':
        return `${noti.sender.username} đã thả cảm xúc.`;
      default:
        return 'Bạn có một thông báo mới.';
    }
  };

  return (
    <div className="notifications-page">
      <h2>Thông báo</h2>
      {notifications.length === 0 ? (
        <p className="empty-message">Không có thông báo nào.</p>
      ) : (
        <ul className="notification-list">
          {notifications.map((noti) => (
            <li
              key={noti._id}
              className={`notification-item ${noti.isRead ? 'read' : 'unread'}`}
              onClick={() => handleMarkAsRead(noti)}
              style={{ cursor: 'pointer' }}
            >
              <img
                src={noti.sender.avatar || 'https://via.placeholder.com/40'}
                alt={noti.sender.username}
              />
              <div className="notification-content">
                <span>{renderContent(noti)}</span>
                <small>{new Date(noti.createdAt).toLocaleString()}</small>
              </div>
              {noti.link && (
                <span className="view-link">Xem</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationsPage;
