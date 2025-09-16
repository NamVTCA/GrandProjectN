import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useSocket } from '../../../hooks/useSocket';
import { useAuth } from '../../auth/AuthContext';
import { acceptGroupInvite, declineGroupInvite } from '../../../services/group.api';

interface Notification {
  _id: string;
  sender?: { username?: string; fullName?: string; avatar?: string };
  type: string;
  metadata?: { gameName?: string; inviteId?: string; groupId?: string };
  createdAt?: string;
}

const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const notificationSocket = useSocket('notifications');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!notificationSocket || !user) return;

    notificationSocket.on('newNotification', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    return () => {
      notificationSocket.off('newNotification');
    };
  }, [notificationSocket, user]);

  const handleAccept = async (notif: Notification) => {
    if (!notif.metadata?.inviteId) return;
    try {
      await acceptGroupInvite(notif.metadata.inviteId);
      setNotifications(prev => prev.filter(n => n._id !== notif._id));
    } catch {}
  };

  const handleDecline = async (notif: Notification) => {
    if (!notif.metadata?.inviteId) return;
    try {
      await declineGroupInvite(notif.metadata.inviteId);
      setNotifications(prev => prev.filter(n => n._id !== notif._id));
    } catch {}
  };

  const renderItem = (notif: Notification) => {
    if (notif.type === 'GROUP_INVITE') {
      const inviter = notif.sender?.username || notif.sender?.fullName || 'Ai đó';
      return (
        <View style={styles.notificationItem}>
          <Text style={styles.notificationText}>
            {inviter} đã mời bạn tham gia nhóm.
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.acceptButton}
              onPress={() => handleAccept(notif)}
            >
              <Text style={styles.buttonText}>Tham gia</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.declineButton}
              onPress={() => handleDecline(notif)}
            >
              <Text style={styles.declineText}>Từ chối</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    switch (notif.type) {
      case 'NEW_LIKE': 
        return (
          <View style={styles.notificationItem}>
            <Text style={styles.notificationText}>
              {notif.sender?.username} đã thích bài viết của bạn.
            </Text>
          </View>
        );
      case 'NEW_COMMENT': 
        return (
          <View style={styles.notificationItem}>
            <Text style={styles.notificationText}>
              {notif.sender?.username} đã bình luận bài viết của bạn.
            </Text>
          </View>
        );
      case 'NEW_FOLLOWER': 
        return (
          <View style={styles.notificationItem}>
            <Text style={styles.notificationText}>
              {notif.sender?.username} đã bắt đầu theo dõi bạn.
            </Text>
          </View>
        );
      case 'GAME_INVITE': 
        return (
          <View style={styles.notificationItem}>
            <Text style={styles.notificationText}>
              {notif.sender?.username} đã mời bạn chơi {notif.metadata?.gameName}.
            </Text>
          </View>
        );
      default: 
        return (
          <View style={styles.notificationItem}>
            <Text style={styles.notificationText}>Bạn có thông báo mới.</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setIsOpen(!isOpen)} style={styles.bellButton}>
        <Text>🔔</Text>
        {notifications.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{notifications.length}</Text>
          </View>
        )}
      </TouchableOpacity>
      
      {isOpen && (
        <View style={styles.dropdown}>
          <ScrollView style={styles.scrollView}>
            {notifications.length === 0 ? (
              <View style={styles.notificationItem}>
                <Text style={styles.notificationText}>Không có thông báo mới.</Text>
              </View>
            ) : (
              notifications.map(notif => (
                <View key={notif._id}>
                  {renderItem(notif)}
                </View>
              ))
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  bellButton: {
    padding: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -8,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  dropdown: {
    position: 'absolute',
    top: 40,
    right: 0,
    width: 350,
    maxHeight: 400,
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  scrollView: {
    maxHeight: 400,
  },
  notificationItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  notificationText: {
    color: 'white',
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  acceptButton: {
    backgroundColor: '#2e7d32',
    padding: 6,
    borderRadius: 8,
  },
  declineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3a3f44',
    padding: 6,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
  },
  declineText: {
    color: '#9aa0a6',
    fontSize: 12,
  },
});

export default NotificationBell;