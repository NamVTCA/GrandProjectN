import React, { useEffect, useState } from 'react';
import GameActivity from '../../features/game-activity/components/GameActivity';
import './Rightbar.scss';
import api from '../../services/api';
import { publicUrl } from '../../untils/publicUrl';

interface Friend {
  _id: string;
  username: string;
  avatar: string;
  presenceStatus: 'ONLINE' | 'OFFLINE';
}

const AVATAR_FALLBACK = '/images/avatar-placeholder.png';
const pickUser = (it: any) => it?.friend || it?.user || it;
const pickAvatar = (u: any) => u?.avatar || u?.avatarUrl || u?.profile?.avatarUrl || '';

const Rightbar: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>([]);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await api.get('/users/get/friends');
        // ✏️ changed: chuẩn hoá dữ liệu & avatar sang URL đầy đủ
        const items: Friend[] = (res.data || []).map((it: any) => {
          const u = pickUser(it);
          return {
            _id: u?._id,
            username: u?.username,
            avatar: publicUrl(pickAvatar(u)) || AVATAR_FALLBACK,
            presenceStatus: (u?.presenceStatus || it?.presenceStatus || 'OFFLINE') as 'ONLINE' | 'OFFLINE',
          };
        });
        setFriends(items);
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
                {/* ✏️ changed: luôn dùng URL đã chuẩn hoá + fallback onError */}
                <img
                  src={friend.avatar || AVATAR_FALLBACK}
                  alt={friend.username}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = AVATAR_FALLBACK; }}
                />
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
