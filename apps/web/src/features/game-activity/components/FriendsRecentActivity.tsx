import React, { useEffect, useMemo, useState } from 'react';
import api from '../../../services/api';
import { publicUrl } from '../../../untils/publicUrl';
import './FriendsRecentActivity.scss';

type FriendPlaying = {
  userId: string;
  username: string;
  avatarUrl?: string; // từ API (có cũng được, không có thì FE join)
  gameName: string;
  boxArtUrl?: string;
  updatedAt: string;
};

type FriendLite = {
  _id: string;
  username: string;
  avatar: string; // đã được publicUrl ở Rightbar hoặc là path tương đối
};

const AVATAR_FALLBACK = '/images/avatar-placeholder.png';
const REFRESH_MS = 20000;

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s trước`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  return `${d} ngày trước`;
}

interface Props {
  friends: FriendLite[];
}

const FriendsRecentActivity: React.FC<Props> = ({ friends }) => {
  const [items, setItems] = useState<FriendPlaying[]>([]);
  const [loading, setLoading] = useState(false);

  // Map id -> friend để lấy avatar/name từ FE
  const friendMap = useMemo(() => {
    const m = new Map<string, FriendLite>();
    for (const f of friends) m.set(f._id, f);
    return m;
  }, [friends]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data } = await api.get<FriendPlaying[]>('/game-activity/friends-playing');
      setItems(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  if (loading && !items.length) {
    return <div className="recent-activity"><div className="hint">Đang tải…</div></div>;
  }
  if (!items.length) {
    return <div className="recent-activity"><div className="hint">Chưa có hoạt động mới.</div></div>;
  }

  return (
    <div className="recent-activity">
      {items.map((it) => {
        const friend = friendMap.get(it.userId);
        // Ưu tiên avatar từ FE (friends), sau đó đến avatarUrl từ API, cuối cùng fallback
        const avatarSrc =
          publicUrl(friend?.avatar || '') ||
          publicUrl(it.avatarUrl || '') ||
          AVATAR_FALLBACK;

        // boxArtUrl có thể là absolute (IGDB) hoặc rỗng
        const boxSrc = publicUrl(it.boxArtUrl || '') || it.boxArtUrl || '';

        // Ưu tiên username từ FE nếu muốn đồng nhất
        const displayName = friend?.username || it.username;

        return (
          <div key={`${it.userId}-${it.updatedAt}`} className="activity-item">
            <img
              className="avatar"
              src={avatarSrc}
              alt={displayName}
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = AVATAR_FALLBACK; }}
            />
            <div className="meta">
              <div className="line">
                <b className="user">{displayName}</b>
                <span className="text">&nbsp;đang chơi&nbsp;</span>
                <span className="game" title={it.gameName}>{it.gameName}</span>
              </div>
              <div className="time">{timeAgo(it.updatedAt)}</div>
            </div>
            {boxSrc ? (
              <img className="boxart" src={boxSrc} alt={it.gameName} />
            ) : <div className="boxart fallback" />}
          </div>
        );
      })}
    </div>
  );
};

export default FriendsRecentActivity;
