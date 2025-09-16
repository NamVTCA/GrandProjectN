import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import api from '../../../services/api';
import { publicUrl } from '../../../untils/publicUrl';

type FriendPlaying = {
  userId: string;
  username: string;
  avatarUrl?: string;
  gameName: string;
  boxArtUrl?: string;
  updatedAt: string;
};

type FriendLite = {
  _id: string;
  username: string;
  avatar: string;
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
    return (
      <View style={styles.container}>
        <Text style={styles.hint}>Đang tải…</Text>
      </View>
    );
  }
  if (!items.length) {
    return (
      <View style={styles.container}>
        <Text style={styles.hint}>Chưa có hoạt động mới.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {items.map((it) => {
        const friend = friendMap.get(it.userId);
        const avatarSrc =
          publicUrl(friend?.avatar || '') ||
          publicUrl(it.avatarUrl || '') ||
          AVATAR_FALLBACK;

        const boxSrc = publicUrl(it.boxArtUrl || '') || it.boxArtUrl || '';
        const displayName = friend?.username || it.username;

        return (
          <View key={`${it.userId}-${it.updatedAt}`} style={styles.activityItem}>
            <Image
              style={styles.avatar}
              source={{ uri: avatarSrc }}
              onError={() => ({ uri: AVATAR_FALLBACK })}
            />
            <View style={styles.meta}>
              <View style={styles.line}>
                <Text style={styles.user}>{displayName}</Text>
                <Text style={styles.text}>&nbsp;đang chơi&nbsp;</Text>
                <Text style={styles.game} numberOfLines={1}>{it.gameName}</Text>
              </View>
              <Text style={styles.time}>{timeAgo(it.updatedAt)}</Text>
            </View>
            {boxSrc ? (
              <Image style={styles.boxart} source={{ uri: boxSrc }} />
            ) : <View style={[styles.boxart, styles.fallbackBoxart]} />}
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  hint: {
    fontSize: 12,
    color: '#9AA0A6',
    opacity: 0.9,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  meta: {
    flex: 1,
    minWidth: 0,
    marginLeft: 8,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'baseline',
    minWidth: 0,
  },
  user: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  text: {
    color: '#9AA0A6',
    fontSize: 12,
  },
  game: {
    color: '#31D0AA',
    fontWeight: '600',
    fontSize: 13,
  },
  time: {
    fontSize: 11,
    color: '#9AA0A6',
    marginTop: 2,
  },
  boxart: {
    width: 40,
    height: 54,
    borderRadius: 6,
  },
  fallbackBoxart: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});

export default FriendsRecentActivity;