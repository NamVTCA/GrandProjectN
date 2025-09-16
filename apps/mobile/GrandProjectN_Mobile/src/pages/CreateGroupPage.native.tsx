// path: screens/CreateGroupPage.native.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import * as groupApi from '../services/group.api';
import { getInterests } from '../services/interest.api';
import type { CreateGroupDto } from '../features/groups/types/GroupDto';
import type { Interest } from '../features/groups/types/Group';

const LocalButton: React.FC<{
  title: string;
  onPress?: () => void;
  disabled?: boolean;
}> = ({ title, onPress, disabled }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={[styles.button, disabled && styles.buttonDisabled]}
    disabled={disabled}
  >
    <Text style={styles.buttonText}>{title}</Text>
  </TouchableOpacity>
);

const CheckboxItem: React.FC<{
  label: string;
  checked: boolean;
  onToggle: () => void;
}> = ({ label, checked, onToggle }) => (
  <TouchableOpacity onPress={onToggle} style={styles.interestTag}>
    <Text style={{ marginRight: 8 }}>{checked ? '✓' : '+'}</Text>
    <Text>{label}</Text>
  </TouchableOpacity>
);

const CreateGroupPage: React.FC = () => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'private'>('public');
  const [selectedInterestIds, setSelectedInterestIds] = useState<string[]>([]);

  // ✅ Fix useQuery (cần object với queryKey + queryFn)
  const { data: allInterests = [], isLoading: isLoadingInterests } = useQuery<Interest[]>({
    queryKey: ['interests'],
    queryFn: getInterests,
  });

  const createGroupMutation = useMutation({
    mutationFn: groupApi.createGroup,
    onSuccess: (newGroup: any) => {
      queryClient.invalidateQueries({ queryKey: ['groups', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['groups', 'suggestions'] });
      // điều hướng: giả định có route 'Group'
      // @ts-ignore
      navigation.navigate('Group' as never, { id: newGroup._id } as never);
    },
    onError: (error: any) => {
      Alert.alert(
        'Lỗi',
        `Tạo nhóm thất bại: ${error?.response?.data?.message || error?.message || 'Unknown'}`
      );
    },
  });

  const handleInterestToggle = (interestId: string) => {
    setSelectedInterestIds(prev =>
      prev.includes(interestId) ? prev.filter(id => id !== interestId) : [...prev, interestId]
    );
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Tên nhóm không được để trống.');
      return;
    }
    const groupData: CreateGroupDto = {
      name,
      description,
      privacy,
      interestIds: selectedInterestIds,
    };
    createGroupMutation.mutate(groupData);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.form}>
        <Text style={styles.heading}>Tạo nhóm mới</Text>
        <Text style={styles.sub}>Kết nối với những người cùng sở thích và đam mê.</Text>

        <Text style={styles.label}>Tên nhóm</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ví dụ: Hội những người yêu game..."
        />

        <Text style={styles.label}>Mô tả (tùy chọn)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Giới thiệu về nhóm của bạn..."
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Chọn sở thích (tùy chọn)</Text>
        {isLoadingInterests ? (
          <ActivityIndicator />
        ) : (
          <View style={styles.interestsContainer}>
            {allInterests.map((interest: Interest) => (
              <CheckboxItem
                key={interest._id}
                label={interest.name}
                checked={selectedInterestIds.includes(interest._id)}
                onToggle={() => handleInterestToggle(interest._id)}
              />
            ))}
          </View>
        )}

        <Text style={styles.label}>Quyền riêng tư</Text>
        <View style={styles.privacyRow}>
          <TouchableOpacity onPress={() => setPrivacy('public')} style={styles.privacyOption}>
            <Text style={privacy === 'public' ? styles.privacySelected : undefined}>🌍 Công khai</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setPrivacy('private')} style={styles.privacyOption}>
            <Text style={privacy === 'private' ? styles.privacySelected : undefined}>🔒 Riêng tư</Text>
          </TouchableOpacity>
        </View>

        <LocalButton
          title={createGroupMutation.isPending ? 'Đang tạo...' : 'Tạo nhóm'}
          onPress={handleSubmit}
          disabled={createGroupMutation.isPending}
        />
      </View>
    </ScrollView>
  );
};

export default CreateGroupPage;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    elevation: 2,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  sub: {
    fontSize: 13,
    color: '#555',
    marginBottom: 12,
  },
  label: {
    marginTop: 12,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  interestTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 8,
    marginBottom: 8,
  },
  privacyRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  privacyOption: {
    marginRight: 12,
    paddingVertical: 6,
  },
  privacySelected: {
    fontWeight: '700',
    color: '#111827',
  },
  button: {
    marginTop: 16,
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
