import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import Cog from 'react-native-vector-icons/FontAwesome5';
import SignIn from 'react-native-vector-icons/FontAwesome5';
import SignOut from 'react-native-vector-icons/FontAwesome5';
import type { GroupDetail } from '../types/Group';
import CoverAvatarEditMenu from './CoverAvatarEditMenu';
import { publicUrl } from '../../../untils/publicUrl';

export type RootStackParamList = {
  GroupDetail: { groupId: string };
  GroupManage: { groupId: string };
};

type GroupHeaderProps = {
  group: GroupDetail;
  isOwner: boolean;
  isMember: boolean;
  isProcessing: boolean;
  joinStatus: 'MEMBER' | 'PENDING' | 'NONE';
  onJoinLeaveClick: () => void;
  mode?: 'detail' | 'create';
};

const GroupHeader: React.FC<GroupHeaderProps> = ({
  group,
  isMember,
  isOwner,
  onJoinLeaveClick,
  isProcessing,
  joinStatus,
  mode = 'detail',
}) => {
  const [coverImage, setCoverImage] = useState<string | undefined>(group.coverImage);
  const [avatar, setAvatar] = useState<string | undefined>(group.avatar);

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    setCoverImage(group.coverImage);
    setAvatar(group.avatar);
  }, [group._id, group.coverImage, group.avatar]);

  const renderActionButton = () => {
    if (mode === 'create') return null;

    if (isOwner) {
      return (
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.navigate('GroupManage', { groupId: group._id })}
          disabled={isProcessing}
        >
          <Cog name="cog" size={16} style={{ marginRight: 8 }} />
          <Text style={styles.buttonText}>Quản lý nhóm</Text>
        </TouchableOpacity>
      );
    }

    if (joinStatus === 'MEMBER') {
      return (
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={onJoinLeaveClick}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Text style={styles.buttonText}>Đang xử lý...</Text>
          ) : (
            <>
              <SignOut name="sign-out-alt" size={16} style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>Rời khỏi nhóm</Text>
            </>
          )}
        </TouchableOpacity>
      );
    }

    if (joinStatus === 'PENDING') {
      return (
        <TouchableOpacity style={[styles.button, styles.secondaryButton]} disabled>
          <Text style={styles.buttonText}>Đang chờ phê duyệt</Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.button, styles.primaryButton]}
        onPress={onJoinLeaveClick}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <Text style={styles.buttonText}>Đang xử lý...</Text>
        ) : (
          <>
            <SignIn name="sign-in-alt" size={16} style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Tham gia nhóm</Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.header}>
      <View style={styles.cover}>
        <Image
          style={styles.coverImage}
          source={{
            uri:
              publicUrl(coverImage) ||
              'https://placehold.co/1200x400/2a2a2a/404040?text=Cover',
          }}
        />

        {mode !== 'create' && isOwner && (
          <View style={styles.editButtonContainer}>
            <CoverAvatarEditMenu
              groupId={group._id}
              onCoverUploaded={(url) => setCoverImage(url)}
              onAvatarUploaded={(url) => setAvatar(url)}
            />
          </View>
        )}

        <View style={styles.infoContainer}>
          <View style={styles.avatarContainer}>
            <Image
              style={styles.avatar}
              source={{
                uri:
                  publicUrl(avatar) ||
                  'https://placehold.co/150x150/2a2a2a/ffffff?text=G',
              }}
            />
          </View>

          <View style={styles.details}>
            <Text style={styles.name}>{group.name}</Text>
            <Text style={styles.meta}>
              {group.privacy === 'public' ? 'Công khai' : 'Riêng tư'} ·{' '}
              {group.memberCount} thành viên
            </Text>
          </View>

          <View style={styles.actions}>{renderActionButton()}</View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#2A2A35',
    marginBottom: 20,
  },
  cover: {
    height: 350,
    maxHeight: '40%',
    minHeight: 200,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  editButtonContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 10,
  },
  infoContainer: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 20,
  },
  avatarContainer: {
    width: 168,
    height: 168,
    borderRadius: 84,
    borderWidth: 4,
    borderColor: '#2A2A35',
    backgroundColor: '#2A2A35',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  meta: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9AA0A6',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  actions: {
    marginBottom: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    minWidth: 120,
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

export default GroupHeader;
