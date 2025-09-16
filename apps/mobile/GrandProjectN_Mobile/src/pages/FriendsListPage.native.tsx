import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NavigatorScreenParams } from '@react-navigation/native';
import api from '../services/api';
import { blockUser, unblockUser, getBlockStatus } from '../services/user';
import { useAuth } from '../features/auth/AuthContext';
import { publicUrl } from '../untils/publicUrl';

/** -------------------------
 *   Navigation Param Types
 *  ------------------------- */
export type ChatStackParamList = {
  ChatPage: { userId: string; username: string; avatar?: string };
};

export type RootStackParamList = {
  FriendsList: undefined;
  Chat: NavigatorScreenParams<ChatStackParamList>;
  Profile: { username: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Friend {
  _id: string;
  username: string;
  fullName?: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: number;
}

const FriendsListPage: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blockStatus, setBlockStatus] = useState<Record<string, boolean>>({});
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const response = await api.get('/friends/list');
      const friendsData = response.data.friends || response.data;

      const formattedFriends = friendsData.map((friend: any) => ({
        _id: friend._id || friend.id,
        username: friend.username || friend.name,
        fullName: friend.fullName || friend.username,
        avatar: friend.avatar || friend.profilePicture,
        isOnline: friend.isOnline || false,
        lastSeen: friend.lastSeen,
      }));

      setFriends(formattedFriends);

      const blockStatusMap: Record<string, boolean> = {};
      for (const friend of formattedFriends) {
        try {
          const status = await getBlockStatus(friend._id);
          blockStatusMap[friend._id] = status.blockedByMe;
        } catch (err) {
          console.error(`Error fetching block status for ${friend._id}:`, err);
          blockStatusMap[friend._id] = false;
        }
      }
      setBlockStatus(blockStatusMap);
    } catch (err) {
      console.error('Error fetching friends:', err);
      setError('Failed to load friends list');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (friendId: string) => {
    try {
      await blockUser(friendId);
      setBlockStatus((prev) => ({ ...prev, [friendId]: true }));
      Alert.alert('Success', 'User blocked successfully');
    } catch (err) {
      console.error('Error blocking user:', err);
      Alert.alert('Error', 'Failed to block user');
    }
  };

  const handleUnblockUser = async (friendId: string) => {
    try {
      await unblockUser(friendId);
      setBlockStatus((prev) => ({ ...prev, [friendId]: false }));
      Alert.alert('Success', 'User unblocked successfully');
    } catch (err) {
      console.error('Error unblocking user:', err);
      Alert.alert('Error', 'Failed to unblock user');
    }
  };

  const handleUnfriend = async (friendId: string) => {
    Alert.alert('Confirm', 'Are you sure you want to remove this friend?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/friends/${friendId}`);
            setFriends((prev) => prev.filter((friend) => friend._id !== friendId));
            Alert.alert('Success', 'Friend removed successfully');
          } catch (err) {
            console.error('Error removing friend:', err);
            Alert.alert('Error', 'Failed to remove friend');
          }
        },
      },
    ]);
  };

  const handleChat = (friendId: string, username: string, avatar?: string) => {
    navigation.navigate('Chat', {
      screen: 'ChatPage',
      params: { userId: friendId, username, avatar },
    });
  };

  const handleViewProfile = (friendId: string, username: string) => {
    navigation.navigate('Profile', { username: username || friendId });
  };

  const formatLastSeen = (timestamp?: number): string => {
    if (!timestamp) return 'a long time ago';

    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    return `${days} days ago`;
  };

  const renderFriendItem = ({ item }: { item: Friend }) => (
    <View style={styles.friendItem}>
      <View style={styles.friendInfo}>
        <View style={styles.friendAvatar}>
          <Image
            source={{
              uri: item.avatar ? publicUrl(item.avatar) : '../images/default-user.png',
            }}
            style={styles.avatarImage}
          />
          <View
            style={[styles.statusIndicator, item.isOnline ? styles.online : styles.offline]}
          />
        </View>
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>{item.fullName}</Text>
          <Text style={styles.friendUsername}>@{item.username}</Text>
          <Text style={styles.friendStatus}>
            {item.isOnline ? 'Online' : `Last seen ${formatLastSeen(item.lastSeen)}`}
          </Text>
        </View>
      </View>

      <View style={styles.friendActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.chatButton]}
          onPress={() => handleChat(item._id, item.username, item.avatar)}
        >
          <Text style={styles.buttonText}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.profileButton]}
          onPress={() => handleViewProfile(item._id, item.username)}
        >
          <Text style={styles.buttonText}>Profile</Text>
        </TouchableOpacity>
        {blockStatus[item._id] ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.unblockButton]}
            onPress={() => handleUnblockUser(item._id)}
          >
            <Text style={styles.buttonText}>Unblock</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, styles.blockButton]}
            onPress={() => handleBlockUser(item._id)}
          >
            <Text style={styles.buttonText}>Block</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionButton, styles.unfriendButton]}
          onPress={() => handleUnfriend(item._id)}
        >
          <Text style={styles.buttonText}>Unfriend</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Friends List</Text>
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#4a7cff" />
          <Text style={styles.loadingText}>Loading friends...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Friends List</Text>
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Friends List</Text>
        <Text style={styles.friendsCount}>{friends.length} friends</Text>
      </View>

      <FlatList
        data={friends}
        renderItem={renderFriendItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.centerContent}>
            <Text style={styles.emptyText}>You don't have any friends yet.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e1f24' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2c2d33',
  },
  headerTitle: { fontSize: 24, fontWeight: '600', color: '#fff' },
  friendsCount: { color: '#888', fontSize: 14 },
  listContent: { padding: 16 },
  friendItem: {
    backgroundColor: '#2c2d33',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  friendInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  friendAvatar: { position: 'relative', width: 50, height: 50, marginRight: 16 },
  avatarImage: { width: '100%', height: '100%', borderRadius: 25 },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#2c2d33',
  },
  online: { backgroundColor: '#3cc76a' },
  offline: { backgroundColor: '#888' },
  friendDetails: { flex: 1 },
  friendName: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 4 },
  friendUsername: { color: '#888', fontSize: 14, marginBottom: 4 },
  friendStatus: { color: '#aaa', fontSize: 12 },
  friendActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionButton: { padding: 8, borderRadius: 6, minWidth: 70, alignItems: 'center' },
  chatButton: { backgroundColor: '#3a3b43' },
  profileButton: { backgroundColor: '#2c2d33', borderWidth: 1, borderColor: '#3a3b43' },
  blockButton: { backgroundColor: '#ff4757' },
  unblockButton: { backgroundColor: '#ffa502' },
  unfriendButton: { backgroundColor: '#ff4757' },
  buttonText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { color: '#888', fontSize: 16, marginTop: 16 },
  errorText: { color: '#ff4757', fontSize: 16, textAlign: 'center' },
  emptyText: { color: '#888', fontSize: 16, textAlign: 'center' },
});

export default FriendsListPage;
