import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { publicUrl } from '../../untils/publicUrl';
import GameActivity from '../../features/game-activity/components/GameActivity';
import FriendsRecentActivity from '../../features/game-activity/components/FriendsRecentActivity';

interface Friend {
  _id: string;
  username: string;
  avatar: string;
  presenceStatus: 'ONLINE' | 'OFFLINE';
}

const AVATAR_FALLBACK = require('./avatar-placeholder.png');
const pickUser = (it: any) => it?.friend || it?.user || it;
const pickAvatar = (u: any) => u?.avatar || u?.avatarUrl || u?.profile?.avatarUrl || '';

const REFRESH_MS = 20000;

const Rightbar: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const navigation = useNavigation();

  const fetchFriends = async () => {
    try {
      const res = await api.get('/users/get/friends');
      const items: Friend[] = (res.data || []).map((it: any) => {
        const u = pickUser(it);
        return {
          _id: String(u?._id),
          username: String(u?.username || ''),
          avatar: publicUrl(pickAvatar(u)) || '',
          presenceStatus: (u?.presenceStatus || it?.presenceStatus || 'OFFLINE') as 'ONLINE' | 'OFFLINE',
        };
      });
      setFriends(items);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách bạn bè:', error);
    }
  };

  useEffect(() => {
    fetchFriends();
    const id = setInterval(fetchFriends, REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  const handleFriendClick = (friend: Friend) => {
    navigation.navigate('Profile' as never, { username: friend.username } as never);
  };

  const styles = StyleSheet.create({
    rightbar: {
      width: 260,
      backgroundColor: '#0e4420',
      borderLeftWidth: 1,
      borderLeftColor: '#083b38',
      padding: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      color: '#c1cd78',
      marginBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#083b38',
      paddingBottom: 4,
    },
    placeholderText: {
      fontSize: 14,
      color: '#9db38c',
      fontStyle: 'italic',
    },
    friendList: {
      marginTop: 8,
    },
    friendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 8,
      borderRadius: 6,
      marginBottom: 8,
    },
    friendInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    friendAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      marginRight: 8,
      borderWidth: 2,
      borderColor: '#083b38',
    },
    friendName: {
      color: '#d5e4c3',
      fontSize: 14,
      flex: 1,
    },
    statusIndicator: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginLeft: 8,
      borderWidth: 2,
      borderColor: '#083b38',
    },
    online: {
      backgroundColor: '#28a745',
    },
    offline: {
      backgroundColor: '#6c757d',
    },
  });

  return (
    <View style={styles.rightbar}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Đang chơi</Text>
        <GameActivity />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bạn bè</Text>
        {friends.length === 0 ? (
          <Text style={styles.placeholderText}>Bạn chưa có bạn bè nào.</Text>
        ) : (
          <FlatList
            data={friends}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.friendItem,
                  { backgroundColor: item.presenceStatus === 'ONLINE' ? 'rgba(193, 205, 120, 0.1)' : 'transparent' },
                ]}
                onPress={() => handleFriendClick(item)}
              >
                <View style={styles.friendInfo}>
                  <Image
                    source={item.avatar ? { uri: item.avatar } : AVATAR_FALLBACK}
                    style={styles.friendAvatar}
                    onError={() => {/* Handle error */}}
                  />
                  <Text style={styles.friendName} numberOfLines={1}>
                    {item.username}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusIndicator,
                    item.presenceStatus === 'ONLINE' ? styles.online : styles.offline,
                  ]}
                />
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hoạt động gần đây</Text>
        <FriendsRecentActivity friends={friends} />
      </View>
    </View>
  );
};

export default Rightbar;