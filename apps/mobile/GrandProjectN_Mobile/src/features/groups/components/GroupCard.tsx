import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import type { Group } from '../types/Group';
import api from '../../../services/api';
import { publicUrl } from '../../../untils/publicUrl';

// Định nghĩa các route chính cho navigation
export type RootStackParamList = {
  GroupDetail: { groupId: string };
  GroupManage: { groupId: string };
  // Nếu có màn hình khác có thể thêm ở đây
};

interface GroupCardProps {
  group: Group;
  isMember: boolean;
  isOwner: boolean;
  onGroupUpdate: () => void;
}

const GroupCard: React.FC<GroupCardProps> = ({ group, isMember, isOwner, onGroupUpdate }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const handleJoinClick = async () => {
    setIsProcessing(true);
    try {
      await api.post(`/groups/${group._id}/join`);
      onGroupUpdate();
    } catch (error) {
      console.error('Lỗi khi tham gia nhóm:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCardClick = () => {
    navigation.navigate('GroupDetail', { groupId: group._id });
  };

  const renderActionButton = () => {
    if (isOwner) {
      return (
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.navigate('GroupManage', { groupId: group._id })}
        >
          <Text style={styles.buttonText}>Quản lý</Text>
        </TouchableOpacity>
      );
    }

    if (isMember) {
      return (
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => navigation.navigate('GroupDetail', { groupId: group._id })}
        >
          <Text style={styles.buttonText}>Xem nhóm</Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.button, styles.primaryButton]}
        onPress={handleJoinClick}
        disabled={isProcessing}
      >
        <Text style={styles.buttonText}>
          {isProcessing ? 'Đang xử lý...' : 'Tham gia'}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handleCardClick}>
      <View style={styles.banner}>
        <Image
          style={styles.bannerImage}
          source={{
            uri:
              publicUrl(group.coverImage) ||
              'https://placehold.co/300x120/25282e/a9b3c1?text=Cover',
          }}
        />
      </View>
      <View style={styles.content}>
        <View style={styles.avatarContainer}>
          <Image
            style={styles.avatar}
            source={{
              uri:
                publicUrl(group.avatar) ||
                'https://placehold.co/80x80/363a41/f0f2f5?text=Logo',
            }}
          />
        </View>
        <Text style={styles.name}>{group.name}</Text>
        <Text style={styles.memberCount}>{group.memberCount} thành viên</Text>
        <View style={styles.actions}>{renderActionButton()}</View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2A2A35',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  banner: {
    height: 120,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: 16,
    paddingTop: 48,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'absolute',
    top: -40,
    alignSelf: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#2A2A35',
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  memberCount: {
    fontSize: 14,
    color: '#9AA0A6',
    marginBottom: 12,
  },
  actions: {
    width: '100%',
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#31D0AA',
  },
  secondaryButton: {
    backgroundColor: '#4A5568',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default GroupCard;
