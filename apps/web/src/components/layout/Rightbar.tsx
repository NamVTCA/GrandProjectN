import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import GameActivity from '../../features/game-activity/components/GameActivity';
import FriendsRecentActivity from '../../features/game-activity/components/FriendsRecentActivity'; // <<< NEW
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
const pickAvatar = (u: any) =>
  u?.avatar || u?.avatarUrl || u?.profile?.avatarUrl || '';

const REFRESH_MS = 20000; // 20s cập nhật bạn bè (tuỳ chọn)

const Rightbar: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const fetchFriends = async () => {
    try {
      const res = await api.get('/users/get/friends');
      const items: Friend[] = (res.data || []).map((it: any) => {
        const u = pickUser(it);
        return {
          _id: String(u?._id),
          username: String(u?.username || ''),
          avatar: publicUrl(pickAvatar(u)) || AVATAR_FALLBACK,
          presenceStatus: (u?.presenceStatus ||
            it?.presenceStatus ||
            'OFFLINE') as 'ONLINE' | 'OFFLINE',
        };
      });
      setFriends(items);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách bạn bè:', error);
    }
  };

  useEffect(() => {
    fetchFriends();
    const id = setInterval(fetchFriends, REFRESH_MS); // (tuỳ chọn) auto refresh
    return () => clearInterval(id);
  }, []);

  const handleFriendClick = (friend: Friend) => {
    if (pathname.startsWith('/chat')) {
      // Đang ở trang chat → emit event để ChatPage mở DM
      window.dispatchEvent(
        new CustomEvent('open-dm', {
          detail: {
            userId: friend._id,
            username: friend.username,
            avatar: friend.avatar,
          },
        }),
      );
    } else {
      // Trang khác → đi tới profile
      navigate(`/profile/${friend.username}`);
    }
  };

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
              <li
                key={friend._id}
                className={`friend-item ${friend.presenceStatus.toLowerCase()}`}
                onClick={() => handleFriendClick(friend)}
                title={pathname.startsWith('/chat') ? 'Nhắn tin 1–1' : 'Xem hồ sơ'}
                style={{ cursor: 'pointer' }}
              >
                <img
                  src={friend.avatar || AVATAR_FALLBACK}
                  alt={friend.username}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = AVATAR_FALLBACK;
                  }}
                />
                <span className="friend-name" title={friend.username}>
                  {friend.username}
                </span>
                <span className="status-indicator" />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rightbar-section">
        <h4>Hoạt động gần đây</h4>
        <FriendsRecentActivity friends={friends} /> {/* truyền friends xuống */}
      </div>
    </aside>
  );
};

export default Rightbar;
