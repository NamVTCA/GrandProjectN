import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, Alert, FlatList } from 'react-native';
import { Button, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Toast from 'react-native-toast-message';
import moment from 'moment';
import api from '../services/api';
import { acceptGroupInvite, declineGroupInvite } from '../services/group.api';
import { publicUrl } from '../untils/publicUrl';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

moment.locale('vi');

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
    avatarUrl?: string;
    profile?: { avatarUrl?: string };
  };
  metadata?: {
    gameName?: string;
    boxArtUrl?: string;
    reason?: string;
    reportReason?: string;
    postContent?: string;
    groupName?: string;
    inviteId?: string;
    groupId?: string;
  };
}

interface Warning {
  _id: string;
  reason: string;
  date: string;
  by: {
    _id: string;
    username: string;
    avatar: string;
    avatarUrl?: string;
    profile?: { avatarUrl?: string };
  };
  reportDetails?: {
    reason: string;
    postContent?: string;
  };
}

type FriendRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

interface FriendRequest {
  _id: string;
  sender: {
    _id: string;
    username: string;
    avatar: string;
    avatarUrl?: string;
    profile?: { avatarUrl?: string };
  };
  status: FriendRequestStatus;
  createdAt: string;
}

const AVATAR_FALLBACK = 'https://via.placeholder.com/40';
const pickAvatar = (s?: { avatar?: string; avatarUrl?: string; profile?: { avatarUrl?: string } }) =>
  s?.avatar || s?.avatarUrl || s?.profile?.avatarUrl || '';
const asAvatar = (u?: string) => publicUrl(u) || AVATAR_FALLBACK;

type RootStackParamList = {
  Notifications: undefined;
  // Add other screens as needed
};

type NotificationsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [warnings, setWarnings] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const navigation = useNavigation<NotificationsScreenNavigationProp>();

  const fetchFriendRequests = async () => {
    try {
      const res = await api.get('/friends/requests');
      setFriendRequests(res.data);
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Lỗi khi lấy lời mời kết bạn',
      });
    }
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications/all');
        setNotifications(res.data);
      } catch {
        Toast.show({
          type: 'error',
          text1: 'Lỗi khi lấy thông báo',
        });
      }
    };

    const fetchWarnings = async () => {
      try {
        const res = await api.get('/users/warnings/get');
        const warningsAsNoti = res.data.map((warn: Warning) => ({
          _id: `warn-${warn._id}`,
          type: 'WARN',
          isRead: false,
          createdAt: warn.date,
          sender: {
            _id: warn.by?._id,
            username: warn.by?.username || 'Admin',
            avatar: pickAvatar(warn.by) || '/default_avatar.png',
          },
          metadata: {
            reason: warn.reason,
            reportReason: warn.reportDetails?.reason,
            postContent: warn.reportDetails?.postContent,
          },
        })) as Notification[];
        setWarnings(warningsAsNoti);
      } catch {
        Toast.show({
          type: 'error',
          text1: 'Lỗi khi lấy cảnh cáo',
        });
      }
    };

    const fetchAll = async () => {
      await Promise.all([fetchNotifications(), fetchWarnings(), fetchFriendRequests()]);
      setLoading(false);
    };

    fetchAll();
  }, []);

  const respondToFriendRequest = async (requestId: string, action: 'ACCEPT' | 'REJECT') => {
    try {
      const map = { ACCEPT: 'ACCEPTED', REJECT: 'REJECTED' } as const;
      await api.post(`/friends/response/${requestId}`, { status: map[action] });
      setFriendRequests((prev) => prev.filter((req) => req._id !== requestId));
      Toast.show({
        type: 'success',
        text1: `Đã ${action === 'ACCEPT' ? 'chấp nhận' : 'từ chối'} lời mời kết bạn`,
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Lỗi khi xử lý lời mời',
      });
    }
  };

  const respondToGroupInvite = async (inviteId: string, action: 'ACCEPT' | 'DECLINE', notiId: string) => {
    try {
      if (action === 'ACCEPT') {
        await acceptGroupInvite(inviteId);
        Toast.show({
          type: 'success',
          text1: 'Đã tham gia nhóm',
        });
      } else {
        await declineGroupInvite(inviteId);
        Toast.show({
          type: 'info',
          text1: 'Đã từ chối lời mời nhóm',
        });
      }
      setNotifications((prev) => prev.filter((n) => n._id !== notiId));
    } catch (err) {
      console.error('Lỗi khi xử lý lời mời nhóm:', err);
      Toast.show({
        type: 'error',
        text1: 'Lỗi khi xử lý lời mời nhóm',
      });
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Lỗi khi đánh dấu đã đọc',
      });
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      Toast.show({
        type: 'success',
        text1: 'Đã xóa thông báo',
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Lỗi khi xóa thông báo',
      });
    }
  };

  const handleDeleteWarning = async (id: string) => {
    const rawId = id.replace('warn-', '');
    try {
      await api.delete(`/users/warnings/delete/${rawId}`);
      setWarnings((prev) => prev.filter((n) => n._id !== id));
      Toast.show({
        type: 'success',
        text1: 'Đã xóa cảnh báo',
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Lỗi khi xoá cảnh cáo',
      });
    }
  };

  const handleClearAll = async (type: 'notifications' | 'warnings' | 'friendRequests') => {
    try {
      if (type === 'notifications') {
        await api.delete('/notifications/clear');
        setNotifications([]);
      } else if (type === 'warnings') {
        await api.delete('/users/warnings/clear');
        setWarnings([]);
      } else if (type === 'friendRequests') {
        await api.delete('/friends/requests/clear');
        setFriendRequests([]);
      }
      Toast.show({
        type: 'success',
        text1: `Đã xóa tất cả ${
          type === 'notifications' ? 'thông báo' : type === 'warnings' ? 'cảnh báo' : 'lời mời kết bạn'
        }`,
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: `Lỗi khi xóa tất cả ${type}`,
      });
    }
  };

  const renderNotificationMessage = (noti: Notification) => {
    const senderName = noti.sender?.username || 'Người dùng';
    switch (noti.type) {
      case 'NEW_REACTION':
        return `${senderName} đã bày tỏ cảm xúc với bài viết của bạn`;
      case 'NEW_COMMENT':
        return `${senderName} đã bình luận về bài viết của bạn`;
      case 'NEW_FOLLOWER':
        return `${senderName} đã bắt đầu theo dõi bạn`;
      case 'FRIEND_REQUEST':
        return `${senderName} đã gửi lời mời kết bạn`;
      case 'FRIEND_ACCEPTED':
        return `${senderName} đã chấp nhận lời mời kết bạn của bạn`;
      case 'GAME_INVITE':
        return `${senderName} đã mời bạn chơi ${noti.metadata?.gameName || 'một trò chơi'}`;
      case 'GROUP_INVITE':
        return `${senderName} đã mời bạn tham gia nhóm ${noti.metadata?.groupName || ''}`;
      case 'GROUP_REQUEST_ACCEPTED':
        return `Yêu cầu tham gia nhóm của bạn đã được chấp nhận`;
      case 'GROUP_REQUEST_REJECTED':
        return `Yêu cầu tham gia nhóm của bạn đã bị từ chối`;
      case 'POST_DELETED_BY_ADMIN':
        return `Bài viết của bạn đã bị xóa bởi quản trị viên`;
      case 'WARN':
        return `${senderName} đã cảnh cáo bạn`;
      default:
        return `${senderName} đã gửi cho bạn một thông báo`;
    }
  };

  const renderNotificationReason = (noti: Notification) => {
    if (!noti.metadata?.reason && !noti.metadata?.reportReason) return null;
    return (
      <View style={styles.notificationReason}>
        {noti.metadata?.reason && (
          <Text>
            <Text style={styles.boldText}>Lý do:</Text> {noti.metadata.reason}
          </Text>
        )}
        {noti.metadata?.reportReason && (
          <Text>
            <Text style={styles.boldText}>Nguyên nhân báo cáo:</Text> {noti.metadata.reportReason}
          </Text>
        )}
      </View>
    );
  };

  const renderWarningDetails = (noti: Notification) => (
    <View style={styles.warningDetails}>
      {noti.metadata?.reportReason && (
        <View style={styles.detailItem}>
          <Text style={styles.boldText}>Nguyên nhân báo cáo:</Text> {noti.metadata.reportReason}
        </View>
      )}
      {noti.metadata?.postContent && (
        <View style={styles.detailItem}>
          <Text style={styles.boldText}>Nội dung bài viết:</Text>
          <View style={styles.postContentPreview}>
            <Text>{noti.metadata.postContent}</Text>
          </View>
        </View>
      )}
      {noti.metadata?.reason && (
        <View style={styles.detailItem}>
          <Text style={styles.boldText}>Lý do cảnh cáo:</Text> {noti.metadata.reason}
        </View>
      )}
    </View>
  );

  const renderNotificationItem = ({ item }: { item: Notification }) => {
    const isWarning = item.type === 'WARN';
    
    return (
      <TouchableOpacity 
        style={[styles.notificationItem, !item.isRead && styles.unread, isWarning && styles.warningItem]}
        onPress={() => handleMarkAsRead(item._id)}
      >
        <Image
          source={{ uri: asAvatar(pickAvatar(item.sender)) }}
          style={styles.avatar}
          defaultSource={{ uri: AVATAR_FALLBACK }}
        />
        <View style={styles.notificationContent}>
          <Text style={styles.notificationText}>{renderNotificationMessage(item)}</Text>
          {renderNotificationReason(item)}
          {isWarning && renderWarningDetails(item)}
          <Text style={styles.notificationTime}>{moment(item.createdAt).fromNow()}</Text>

          {item.type === 'GROUP_INVITE' && item.metadata?.inviteId && (
            <View style={styles.actionButtons}>
              <Button
                mode="contained"
                onPress={() => respondToGroupInvite(item.metadata!.inviteId!, 'ACCEPT', item._id)}
                style={[styles.actionButton, styles.acceptButton]}
                icon="check"
                compact
              >
                Tham gia
              </Button>
              <Button
                mode="outlined"
                onPress={() => respondToGroupInvite(item.metadata!.inviteId!, 'DECLINE', item._id)}
                style={[styles.actionButton, styles.rejectButton]}
                icon="close"
                compact
              >
                Từ chối
              </Button>
            </View>
          )}
        </View>
        <TouchableOpacity
          onPress={() => isWarning ? handleDeleteWarning(item._id) : handleDeleteNotification(item._id)}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={20} color="#d5e4c3" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderFriendRequestItem = ({ item }: { item: FriendRequest }) => (
    <View style={styles.notificationItem}>
      <Image
        source={{ uri: asAvatar(pickAvatar(item.sender)) }}
        style={styles.avatar}
        defaultSource={{ uri: AVATAR_FALLBACK }}
      />
      <View style={styles.notificationContent}>
        <Text style={styles.notificationText}>
          <Text style={styles.boldText}>{item.sender.username}</Text> đã gửi cho bạn lời mời kết bạn
        </Text>
        <Text style={styles.notificationTime}>{moment(item.createdAt).fromNow()}</Text>
        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            onPress={() => respondToFriendRequest(item._id, 'ACCEPT')}
            style={[styles.actionButton, styles.acceptButton]}
            icon="check"
            compact
          >
            Chấp nhận
          </Button>
          <Button
            mode="outlined"
            onPress={() => respondToFriendRequest(item._id, 'REJECT')}
            style={[styles.actionButton, styles.rejectButton]}
            icon="close"
            compact
          >
            Từ chối
          </Button>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#c1cd78" />
        <Text style={styles.loadingText}>Đang tải thông báo...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Cảnh báo */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Cảnh Báo Của Bạn</Text>
          {warnings.length > 0 && (
            <TouchableOpacity onPress={() => handleClearAll('warnings')}>
              <Text style={styles.clearAll}>Xóa tất cả</Text>
            </TouchableOpacity>
          )}
        </View>
        {warnings.length === 0 ? (
          <Text style={styles.emptyMessage}>Không có cảnh báo nào.</Text>
        ) : (
          <FlatList
            data={warnings}
            renderItem={renderNotificationItem}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
          />
        )}
      </View>

      {/* Lời mời kết bạn */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Lời Mời Kết Bạn</Text>
          {friendRequests.length > 0 && (
            <TouchableOpacity onPress={() => handleClearAll('friendRequests')}>
              <Text style={styles.clearAll}>Xóa tất cả</Text>
            </TouchableOpacity>
          )}
        </View>
        {friendRequests.length === 0 ? (
          <Text style={styles.emptyMessage}>Không có lời mời nào.</Text>
        ) : (
          <FlatList
            data={friendRequests}
            renderItem={renderFriendRequestItem}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
          />
        )}
      </View>

      {/* Thông báo */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Thông Báo</Text>
          {notifications.length > 0 && (
            <TouchableOpacity onPress={() => handleClearAll('notifications')}>
              <Text style={styles.clearAll}>Xóa tất cả</Text>
            </TouchableOpacity>
          )}
        </View>
        {notifications.length === 0 ? (
          <Text style={styles.emptyMessage}>Không có thông báo nào.</Text>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderNotificationItem}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e4420',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0e4420',
  },
  loadingText: {
    marginTop: 10,
    color: '#d5e4c3',
    fontSize: 16,
  },
  sectionContainer: {
    backgroundColor: '#083b38',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#c1cd78',
  },
  clearAll: {
    fontSize: 14,
    color: '#d5e4c3',
  },
  emptyMessage: {
    color: '#d5e4c3',
    textAlign: 'center',
    padding: 20,
    fontStyle: 'italic',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#083b38',
    borderRadius: 8,
  },
  unread: {
    backgroundColor: '#0e4420',
    borderLeftWidth: 3,
    borderLeftColor: '#c1cd78',
  },
  warningItem: {
    backgroundColor: '#0e4420',
    borderLeftWidth: 3,
    borderLeftColor: '#dc3545',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    color: '#d5e4c3',
    fontSize: 14,
    marginBottom: 4,
  },
  notificationTime: {
    color: '#c1cd78',
    fontSize: 12,
    marginTop: 4,
  },
  notificationReason: {
    marginTop: 4,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#d5e4c3',
  },
  warningDetails: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
  },
  detailItem: {
    marginBottom: 6,
  },
  postContentPreview: {
    padding: 8,
    backgroundColor: '#0e4420',
    borderRadius: 4,
    marginTop: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#c1cd78',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  acceptButton: {
    backgroundColor: '#28a745',
  },
  rejectButton: {
    borderColor: '#dc3545',
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
});

