import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import Button from '../common/Button';
import UserAvatar from '../common/UserAvatar';

export interface UserResult {
  _id: string;
  username: string;
  avatar?: string;
  friendshipStatus?: 'FRIENDS' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'NONE';
}

interface SearchResultItemProps {
  user: UserResult;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({ user }) => {
  const [status, setStatus] = useState(user.friendshipStatus || 'NONE');
  const [isProcessing, setIsProcessing] = useState(false);
  const navigation = useNavigation();

  const handleAddFriend = async () => {
    setIsProcessing(true);
    try {
      await api.post(`/friends/request/${user._id}`);
      setStatus('REQUEST_SENT');
    } catch (error) {
      console.error('Lỗi khi gửi lời mời kết bạn:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProfilePress = () => {
    navigation.navigate('Profile' as never, { username: user.username } as never);
  };

  const renderAction = () => {
    switch (status) {
      case 'FRIENDS':
        return <Button variant="secondary" disabled>Bạn bè</Button>;
      case 'REQUEST_SENT':
        return <Button variant="secondary" disabled>Đã gửi lời mời</Button>;
      case 'REQUEST_RECEIVED':
        return (
          <Button 
            variant="primary" 
            onPress={() => navigation.navigate('Notifications' as never)}
          >
            Phản hồi
          </Button>
        );
      default:
        return (
          <Button 
            variant="primary" 
            onPress={handleAddFriend} 
            disabled={isProcessing}
            loading={isProcessing}
          >
            Kết bạn
          </Button>
        );
    }
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#083b38',
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    username: {
      marginLeft: 8,
      fontSize: 14,
      fontWeight: '500',
      color: '#c1cd78',
    },
    actionButton: {
      marginLeft: 8,
    },
  });

  return (
    <TouchableOpacity style={styles.container} onPress={handleProfilePress}>
      <View style={styles.userInfo}>
        <UserAvatar src={user.avatar} size={36} />
        <Text style={styles.username}>{user.username}</Text>
      </View>
      <View style={styles.actionButton}>
        {renderAction()}
      </View>
    </TouchableOpacity>
  );
};

export default SearchResultItem;