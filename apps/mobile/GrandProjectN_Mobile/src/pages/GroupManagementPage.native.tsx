import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as groupApi from '../services/group.api';
import { getInterests } from '../services/interest.api';
import Button from '../components/common/Button';
import { useAuth } from '../features/auth/AuthContext';
import { publicUrl } from '../untils/publicUrl';
import Icon from 'react-native-vector-icons/FontAwesome';

type ManagementTab = 'settings' | 'members' | 'requests' | 'danger';

interface GroupMember {
  user: {
    _id: string;
    username: string;
    avatar?: string;
  };
  role: string;
}

interface JoinRequest {
  _id: string;
  user: {
    _id: string;
    username: string;
    avatar?: string;
  };
}

const GroupManagementPage: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { id: groupId } = route.params as { id: string };
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ManagementTab>('settings');
  const [formState, setFormState] = useState<any>({});

  const { data: group, isLoading: isLoadingGroup } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => groupApi.getGroupById(groupId),
    enabled: !!groupId,
  });

  const { data: members = [], refetch: refetchMembers } = useQuery<GroupMember[]>({
    queryKey: ['groupMembers', groupId],
    queryFn: () => groupApi.getGroupMembers(groupId),
    enabled: !!groupId,
  });

  const { data: requests = [], refetch: refetchRequests } = useQuery<JoinRequest[]>({
    queryKey: ['groupRequests', groupId],
    queryFn: () => groupApi.getGroupJoinRequests(groupId),
    enabled: !!groupId,
  });

  const { data: allInterests = [] } = useQuery({
    queryKey: ['interests'],
    queryFn: getInterests,
  });

  useEffect(() => {
    if (group) {
      setFormState({
        name: group.name,
        description: group.description,
        privacy: group.privacy,
        interestIds: group.interests?.map((interest: any) => interest._id) || [],
      });
    }
  }, [group]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => 
      groupApi.updateGroup({ groupId: groupId, groupData: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      Alert.alert('Thành công', 'Cập nhật thông tin thành công!');
    },
    onError: () => Alert.alert('Lỗi', 'Cập nhật thất bại!'),
  });

  const uploadImageMutation = useMutation({
    mutationFn: groupApi.uploadGroupImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      Alert.alert('Thành công', 'Cập nhật ảnh thành công!');
    },
    onError: () => Alert.alert('Lỗi', 'Tải ảnh lên thất bại!'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => groupApi.deleteGroup(groupId),
    onSuccess: () => {
      Alert.alert('Thành công', 'Đã xóa nhóm thành công.');
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      navigation.goBack();
    },
    onError: () => Alert.alert('Lỗi', 'Xóa nhóm thất bại!'),
  });

  const kickMutation = useMutation({
    mutationFn: (memberUserId: string) => groupApi.kickMember({ groupId: groupId, memberUserId }),
    onSuccess: () => {
      Alert.alert('Thành công', 'Đã xóa thành viên.');
      refetchMembers();
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: (requestId: string) => groupApi.approveJoinRequest(groupId, requestId),
    onSuccess: () => {
      Alert.alert('Thành công', 'Đã chấp thuận thành viên.');
      refetchRequests();
      refetchMembers();
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (requestId: string) => groupApi.rejectJoinRequest(groupId, requestId),
    onSuccess: () => {
      Alert.alert('Thành công', 'Đã từ chối yêu cầu.');
      refetchRequests();
    },
  });

  const handleInputChange = (name: string, value: string) => {
    setFormState((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (imageType: 'avatar' | 'cover') => {
    // In React Native, you would use a library like react-native-image-picker
    Alert.alert('Thông báo', 'Tính năng chọn ảnh sẽ được triển khai với thư viện image picker');
  };

  const handleInterestToggle = (interestId: string) => {
    setFormState((prev: any) => {
      const currentIds = prev.interestIds || [];
      const newIds = currentIds.includes(interestId)
        ? currentIds.filter((id: string) => id !== interestId)
        : [...currentIds, interestId];
      return { ...prev, interestIds: newIds };
    });
  };

  const renderTabContent = () => {
    if (isLoadingGroup) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#c1cd78" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'settings':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Hình ảnh</Text>
            <View style={styles.imageEditors}>
              <View style={styles.imageEditor}>
                <Text style={styles.label}>Ảnh đại diện</Text>
                <TouchableOpacity 
                  style={styles.avatarPreview}
                  onPress={() => handleImageChange('avatar')}
                >
                  <Image 
                    source={{ uri: publicUrl(group?.avatar) || 'https://placehold.co/150x150/2a2a2a/ffffff?text=Avatar' }} 
                    style={styles.avatarImage}
                  />
                  <View style={styles.overlay}>
                    <Icon name="camera" size={24} color="#fff" />
                  </View>
                </TouchableOpacity>
              </View>
              <View style={styles.imageEditor}>
                <Text style={styles.label}>Ảnh bìa</Text>
                <TouchableOpacity 
                  style={styles.coverPreview}
                  onPress={() => handleImageChange('cover')}
                >
                  <Image 
                    source={{ uri: publicUrl(group?.coverImage) || 'https://placehold.co/600x200/2a2a2a/404040?text=Cover' }} 
                    style={styles.coverImage}
                  />
                  <View style={styles.overlay}>
                    <Icon name="camera" size={24} color="#fff" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.separator} />

            <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
            <View style={styles.form}>
              <Text style={styles.label}>Tên nhóm</Text>
              <TextInput
                style={styles.input}
                value={formState.name || ''}
                onChangeText={(value) => handleInputChange('name', value)}
              />
              
              <Text style={styles.label}>Mô tả</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formState.description || ''}
                onChangeText={(value) => handleInputChange('description', value)}
                multiline
                numberOfLines={4}
              />
              
              <Text style={styles.label}>Quyền riêng tư</Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={[styles.radioOption, formState.privacy === 'public' && styles.radioSelected]}
                  onPress={() => handleInputChange('privacy', 'public')}
                >
                  <Text style={styles.radioText}>Công khai</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.radioOption, formState.privacy === 'private' && styles.radioSelected]}
                  onPress={() => handleInputChange('privacy', 'private')}
                >
                  <Text style={styles.radioText}>Riêng tư</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.separator} />

              <Text style={styles.sectionTitle}>Sở thích của nhóm</Text>
              <View style={styles.interestContainer}>
                {allInterests.map((interest: any) => (
                  <TouchableOpacity
                    key={interest._id}
                    style={[
                      styles.interestTag,
                      formState.interestIds?.includes(interest._id) && styles.interestSelected
                    ]}
                    onPress={() => handleInterestToggle(interest._id)}
                  >
                    <Text style={[
                      styles.interestText,
                      formState.interestIds?.includes(interest._id) && styles.interestTextSelected
                    ]}>
                      {interest.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Button
                onPress={() => updateMutation.mutate(formState)}
                disabled={updateMutation.isPending}
                style={styles.saveButton}
              >
                <Icon name="save" size={16} color="#fff" />
                <Text style={styles.buttonText}> Lưu thay đổi</Text>
              </Button>
            </View>
          </View>
        );

      case 'members':
        return (
          <View style={styles.listContainer}>
            <FlatList
              data={members}
              keyExtractor={(item) => item.user._id}
              renderItem={({ item }) => (
                <View style={styles.itemRow}>
                  <View style={styles.itemDetails}>
                    <Image
                      style={styles.itemAvatar}
                      source={{ uri: publicUrl(item.user.avatar) || 'https://via.placeholder.com/48' }}
                    />
                    <View style={styles.itemTextInfo}>
                      <Text style={styles.memberName}>{item.user.username}</Text>
                      <Text style={styles.roleBadge}>{item.role}</Text>
                    </View>
                  </View>
                  {item.role !== 'OWNER' && (
                    <Button
                      variant="danger"
                      size="small"
                      onPress={() => kickMutation.mutate(item.user._id)}
                      disabled={kickMutation.isPending}
                    >
                      Kick
                    </Button>
                  )}
                </View>
              )}
            />
          </View>
        );

      case 'requests':
        return (
          <View style={styles.listContainer}>
            {requests.length > 0 ? (
              <FlatList
                data={requests}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <View style={styles.itemRow}>
                    <View style={styles.itemDetails}>
                      <Image
                        style={styles.itemAvatar}
                        source={{ uri: publicUrl(item.user.avatar) || 'https://via.placeholder.com/48' }}
                      />
                      <Text style={styles.memberName}>{item.user.username}</Text>
                    </View>
                    <View style={styles.requestActions}>
                      <Button
                        onPress={() => approveMutation.mutate(item._id)}
                        disabled={approveMutation.isPending}
                        style={styles.approveButton}
                      >
                        Chấp nhận
                      </Button>
                      <Button
                        onPress={() => rejectMutation.mutate(item._id)}
                        variant="secondary"
                        disabled={rejectMutation.isPending}
                      >
                        Từ chối
                      </Button>
                    </View>
                  </View>
                )}
              />
            ) : (
              <Text style={styles.emptyText}>Không có yêu cầu tham gia nào.</Text>
            )}
          </View>
        );

      case 'danger':
        return (
          <View style={styles.dangerZone}>
            <Text style={styles.sectionTitle}>Xóa nhóm</Text>
            <Text style={styles.dangerText}>
              Hành động này không thể hoàn tác. Tất cả bài viết và dữ liệu liên quan sẽ bị xóa vĩnh viễn.
            </Text>
            <Button
              variant="danger"
              onPress={() => {
                Alert.alert(
                  'Xác nhận',
                  'Bạn có chắc chắn muốn xóa nhóm này?',
                  [
                    { text: 'Hủy', style: 'cancel' },
                    {
                      text: 'Xóa',
                      style: 'destructive',
                      onPress: () => deleteMutation.mutate()
                    }
                  ]
                );
              }}
              disabled={deleteMutation.isPending}
            >
              <Icon name="trash" size={16} color="#fff" />
              <Text style={styles.buttonText}> Xóa nhóm này</Text>
            </Button>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Quản lý nhóm: {group?.name}</Text>
        
        <View style={styles.tabButtons}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'settings' && styles.tabButtonActive]}
            onPress={() => setActiveTab('settings')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'settings' && styles.tabButtonTextActive]}>
              Cài đặt
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'members' && styles.tabButtonActive]}
            onPress={() => setActiveTab('members')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'members' && styles.tabButtonTextActive]}>
              Thành viên ({group?.memberCount || 0})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'requests' && styles.tabButtonActive]}
            onPress={() => setActiveTab('requests')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'requests' && styles.tabButtonTextActive]}>
              Yêu cầu ({requests.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'danger' && styles.tabButtonActive]}
            onPress={() => setActiveTab('danger')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'danger' && styles.tabButtonTextActive]}>
              Vùng nguy hiểm
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabContentContainer}>
          {renderTabContent()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e4420',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#c1cd78',
    marginBottom: 20,
    textAlign: 'center',
  },
  tabButtons: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#083b38',
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  tabButtonActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#c1cd78',
  },
  tabButtonText: {
    color: '#d5e4c3',
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: '#c1cd78',
  },
  tabContentContainer: {
    backgroundColor: '#083b38',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  tabContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#c1cd78',
    marginBottom: 16,
  },
  imageEditors: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  imageEditor: {
    alignItems: 'center',
  },
  label: {
    fontWeight: '600',
    color: '#d5e4c3',
    marginBottom: 8,
  },
  avatarPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#083b38',
    overflow: 'hidden',
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  coverPreview: {
    width: 150,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#083b38',
    overflow: 'hidden',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: '#083b38',
    marginVertical: 20,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#0e4420',
    borderWidth: 1,
    borderColor: '#083b38',
    borderRadius: 4,
    padding: 12,
    color: '#d5e4c3',
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 16,
  },
  radioOption: {
    flex: 1,
    padding: 12,
    borderRadius: 4,
    backgroundColor: '#0e4420',
    borderWidth: 1,
    borderColor: '#083b38',
    alignItems: 'center',
  },
  radioSelected: {
    backgroundColor: '#c1cd78',
    borderColor: '#c1cd78',
  },
  radioText: {
    color: '#d5e4c3',
  },
  interestContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#0e4420',
    borderWidth: 1,
    borderColor: '#083b38',
  },
  interestSelected: {
    backgroundColor: '#c1cd78',
    borderColor: '#c1cd78',
  },
  interestText: {
    color: '#d5e4c3',
  },
  interestTextSelected: {
    color: '#0e4420',
    fontWeight: '600',
  },
  saveButton: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContainer: {
    minHeight: 200,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 4,
    marginBottom: 8,
    backgroundColor: '#0e4420',
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  itemAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  itemTextInfo: {
    gap: 4,
  },
  memberName: {
    color: '#d5e4c3',
    fontWeight: '600',
  },
  roleBadge: {
    fontSize: 12,
    color: '#888',
    backgroundColor: '#083b38',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  approveButton: {
    backgroundColor: '#3cc76a',
  },
  emptyText: {
    color: '#d5e4c3',
    textAlign: 'center',
    padding: 20,
  },
  dangerZone: {
    borderWidth: 2,
    borderColor: '#dc3545',
    borderRadius: 4,
    padding: 20,
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
  },
  dangerText: {
    color: '#d5e4c3',
    marginBottom: 16,
  },
  centerContent: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#d5e4c3',
    marginTop: 16,
  },
});

export default GroupManagementPage;