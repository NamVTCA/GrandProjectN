import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Toast from 'react-native-toast-message';
import api from '../services/api';
import type { UserProfile } from '../features/profile/types/UserProfile';
import { useAuth } from '../features/auth/AuthContext';
import ProfileHeader from '../features/profile/components/ProfileHeader.native';
import UserPostList from '../features/profile/components/UserPostList.native';

type RouteParams = {
  username?: string;
};

type LocationState = {
  updatedProfile?: UserProfile;
};

type RootStackParamList = {
  Profile: { username?: string };
  // Add other screens as needed
};

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const normIds = (arr: any): string[] =>
  Array.isArray(arr)
    ? arr
        .map((x: any) => {
          if (!x) return '';
          if (typeof x === 'string' || typeof x === 'number') return String(x);
          if (typeof x === 'object') return String(x._id ?? x.id ?? '');
          return '';
        })
        .filter(Boolean)
    : [];

const ProfilePage: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const params = route.params as RouteParams;
  const { user: currentUser } = useAuth();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const computeIsFollowing = useCallback(
    (profile: any) => {
      const myId = currentUser?._id ? String(currentUser._id) : '';
      const followers = normIds(profile?.followers);
      return !!myId && followers.includes(myId);
    },
    [currentUser]
  );

  const fetchProfile = useCallback(async () => {
    if (!params?.username) {
      setError('Không xác định username.');
      setLoading(false);
      return;
    }

    try {
      let data: UserProfile;

      // Ưu tiên lấy theo username
      try {
        const res = await api.get<UserProfile>(`/users/${encodeURIComponent(params.username)}`);
        data = res.data;
      } catch (errFirst) {
        // Fallback: nếu param là ObjectId thì thử by-id
        if (/^[a-f\d]{24}$/i.test(String(params.username))) {
          const res = await api.get<UserProfile>(`/users/by-id/${params.username}`);
          data = res.data;
        } else {
          throw errFirst;
        }
      }

      setUserProfile(data);
      setIsFollowing(computeIsFollowing(data));
    } catch (err) {
      console.error(err);
      setError('Không tìm thấy người dùng hoặc có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  }, [params?.username, computeIsFollowing]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleFollowToggle = async () => {
    if (!userProfile || !currentUser) return;
    const myId = String(currentUser._id);
    try {
      if (isFollowing) {
        await api.delete(`/users/${userProfile._id}/follow`);
        setUserProfile(prev =>
          prev ? { ...prev, followers: normIds(prev.followers).filter(id => id !== myId) as any } : prev
        );
        Toast.show({
          type: 'success',
          text1: `Đã bỏ theo dõi ${userProfile.username}`,
        });
      } else {
        await api.post(`/users/${userProfile._id}/follow`);
        setUserProfile(prev =>
          prev ? { ...prev, followers: [...normIds(prev.followers), myId] as any } : prev
        );
        Toast.show({
          type: 'success',
          text1: `Đã theo dõi ${userProfile.username}`,
        });
      }
      setIsFollowing(!isFollowing);
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Lỗi khi thực hiện thao tác',
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#d5e4c3" />
        <Text style={styles.loadingText}>Đang tải hồ sơ...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!userProfile) return null;

  // Kiểm tra trạng thái tài khoản (nếu có)
  const status = (userProfile as any).accountStatus;
  const isAccountSuspendedOrBanned = status === 'SUSPENDED' || status === 'BANNED';
  const isCurrentUserProfile = String(currentUser?._id ?? '') === String(userProfile._id ?? '');

  if (isAccountSuspendedOrBanned && !isCurrentUserProfile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Tài khoản này hiện đang bị {status === 'SUSPENDED' ? 'tạm ngưng' : 'vô hiệu hóa'}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ProfileHeader
        userProfile={userProfile}
        isFollowing={isFollowing}
        onFollowToggle={handleFollowToggle}
      />
      <View style={styles.profileContent}>
        <UserPostList userId={String(userProfile._id)} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e4420',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0e4420',
    padding: 20,
  },
  errorText: {
    color: '#dc3545',
    fontSize: 18,
    textAlign: 'center',
  },
  profileContent: {
    padding: 16,
    backgroundColor: '#083b38',
  },
});

export default ProfilePage;