import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../features/auth/AuthContext';
import UserAvatar from '../common/UserAvatar';
import UnreadBadge from '../../features/chat/components/UnreadBadge';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const [chatTotalUnread, setChatTotalUnread] = useState(0);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ total: number }>;
      setChatTotalUnread(ce.detail?.total ?? 0);
    };
    
    // In React Native, you might need to use a different event system
    // This is a placeholder for whatever event system you're using
    // document.addEventListener('chat-unread-total', handler);
    
    return () => {
      // document.removeEventListener('chat-unread-total', handler);
    };
  }, []);

  const navItems = [
    { path: 'Home', label: 'Trang chủ', icon: 'home' },
    { path: 'Groups', label: 'Nhóm', icon: 'users' },
    { path: 'Chat', label: 'Chat', icon: 'message-circle', showChatBadge: true },
    { path: 'Shop', label: 'Cửa hàng', icon: 'shopping-bag' },
    { path: 'Inventory', label: 'Kho đồ', icon: 'package' },
  ];

  const profilePath = (user as any)?.username ? 'Profile' : 'Profile';

  const styles = StyleSheet.create({
    sidebar: {
      width: 240,
      backgroundColor: '#0e4420',
      borderRightWidth: 1,
      borderRightColor: '#083b38',
      padding: 16,
    },
    logo: {
      marginBottom: 24,
    },
    logoText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#c1cd78',
    },
    navItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 6,
      marginBottom: 8,
    },
    navItemActive: {
      backgroundColor: '#0077cc',
    },
    navIcon: {
      marginRight: 12,
      color: '#d5e4c3',
    },
    navText: {
      color: '#d5e4c3',
      fontWeight: '500',
    },
    navTextActive: {
      color: '#e6f2b0',
    },
    badgeSpace: {
      marginLeft: 8,
    },
    footer: {
      marginTop: 'auto',
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: '#083b38',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    userProfile: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    username: {
      marginLeft: 8,
      color: '#d5e4c3',
      fontSize: 14,
      fontWeight: '500',
    },
    logoutButton: {
      backgroundColor: '#dc3545',
      borderRadius: 6,
      padding: 8,
    },
  });

  return (
    <View style={styles.sidebar}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>Grand</Text>
      </View>

      <View>
        {navItems.map((item) => (
          <TouchableOpacity
            key={item.path}
            style={[
              styles.navItem,
              // Add active state logic based on current route
            ]}
            onPress={() => navigation.navigate(item.path as never)}
          >
            <Feather name={item.icon as any} size={20} style={styles.navIcon} />
            <Text style={styles.navText}>
              {item.label}
              {item.showChatBadge && (
                <UnreadBadge
                  count={chatTotalUnread}
                  style={styles.badgeSpace}
                  size="md"
                />
              )}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.userProfile}
          onPress={() => navigation.navigate(profilePath as never)}
        >
          <UserAvatar
            size={32}
            src={
              (user as any)?.avatarUrl ||
              (user as any)?.avatar ||
              (user as any)?.avatar_url
            }
          />
          <Text style={styles.username}>
            {(user as any)?.username || 'User'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
        >
          <Feather name="log-out" size={20} color="#e6f2b0" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Sidebar;