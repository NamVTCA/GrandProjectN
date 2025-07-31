// File: src/components/layout/Rightbar.tsx
import React, { useEffect, useState } from 'react';
import GameActivity from '../../features/game-activity/components/GameActivity';
import './Rightbar.scss';
import api from '../../services/api';

interface Friend {
  _id: string;
  username: string;
  avatar: string;
  presenceStatus: 'ONLINE' | 'OFFLINE';
}

const Rightbar: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>([]);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await api.get('/users/get/friends');
        setFriends(res.data);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách bạn bè:', error);
      }
    };
    fetchFriends();
  }, []);

  return (
    <aside className="rightbar">
      <div className="rightbar-section">
        <h4>Đang chơi</h4>
        <GameActivity />
      </div>

      <div className="rightbar-section">
        <h4>Bạn bè</h4>
        {friends.length === 0 ? (
          <p className="placeholder-text">Bạn chưa có bạn bè nào.</p>
        ) : (
          <ul className="friend-list">
            {friends.map((friend) => (
              <li key={friend._id} className={`friend-item ${friend.presenceStatus.toLowerCase()}`}>
                <img src={friend.avatar || 'https://via.placeholder.com/40'} alt={friend.username} />
                <span>{friend.username}</span>
                <span className="status-indicator" />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rightbar-section">
        <h4>Hoạt động gần đây</h4>
        <p className="placeholder-text">Chưa có hoạt động mới.</p>
      </div>
    </aside>
  );
};

export default Rightbar;
