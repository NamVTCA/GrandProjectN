import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import api from '../../../services/api';
import { useAuth } from '../../auth/AuthContext';
import type { Post } from '../types/Post';
import { PostVisibility } from '../types/Post';
import UserAvatar from '../../../components/common/UserAvatar';

interface CreatePostProps {
  onPostCreated: (newPost: Post) => void;
  context?: 'profile' | 'group';
  contextId?: string;
}

const CreatePost: React.FC<CreatePostProps> = ({
  onPostCreated,
  context = 'profile',
  contextId,
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [visibility, setVisibility] =
    useState<PostVisibility>(PostVisibility.PUBLIC);

  const CLOUDINARY_CLOUD_NAME = 'das4ycyz9';
  const CLOUDINARY_UPLOAD_PRESET = 'SocialMedia';
  const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;

  const handleFileChange = () => {
    Alert.alert('Thông báo', 'Chức năng chọn ảnh/video sẽ được tích hợp sau');
  };

  const uploadFile = async (file: any): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    const response = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (data.secure_url) {
      return data.secure_url;
    }
    throw new Error('Không thể tải file lên Cloudinary.');
  };

  const handleSubmit = async () => {
    if (!content.trim() && mediaFiles.length === 0) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const mediaUrls =
        mediaFiles.length > 0
          ? await Promise.all(mediaFiles.map((file: any) => uploadFile(file)))
          : [];

      const payload = {
        content,
        mediaUrls,
        groupId: context === 'group' ? contextId : undefined,
        visibility,
      };

      const response = await api.post<Post>('/posts', payload);

      if (response.data && response.data._id) {
        setContent('');
        setMediaFiles([]);
        setVisibility(PostVisibility.PUBLIC);
        onPostCreated(response.data);
      } else {
        throw new Error('Dữ liệu bài viết trả về không hợp lệ');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || 'Đã có lỗi xảy ra.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.createPostCard}>
      <View style={styles.cardHeader}>
        <UserAvatar
          size={40}
          src={
            (user as any)?.avatarUrl ||
            (user as any)?.avatar ||
            (user as any)?.avatar_url
          }
        />
        <TextInput
          style={styles.textarea}
          value={content}
          onChangeText={setContent}
          placeholder={`Bạn đang nghĩ gì, ${user?.username}?`}
          multiline
          numberOfLines={3}
          placeholderTextColor="#a3b18a"
        />
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleFileChange}>
            <Text style={styles.actionBtnText}>Ảnh/Video</Text>
          </TouchableOpacity>
        </View>

        {context !== 'group' && (
          <View style={styles.visibilityContainer}>
            <Text style={styles.visibilityLabel}>Chế độ hiển thị:</Text>
            <View style={styles.visibilitySelect}>
              <TouchableOpacity
                style={[
                  styles.visibilityOption,
                  visibility === PostVisibility.PUBLIC &&
                    styles.visibilityOptionSelected,
                ]}
                onPress={() => setVisibility(PostVisibility.PUBLIC)}>
                <Text style={styles.visibilityOptionText}>🌍 Công khai</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.visibilityOption,
                  visibility === PostVisibility.FRIENDS_ONLY &&
                    styles.visibilityOptionSelected,
                ]}
                onPress={() => setVisibility(PostVisibility.FRIENDS_ONLY)}>
                <Text style={styles.visibilityOptionText}>👥 Bạn bè</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.visibilityOption,
                  visibility === PostVisibility.PRIVATE &&
                    styles.visibilityOptionSelected,
                ]}
                onPress={() => setVisibility(PostVisibility.PRIVATE)}>
                <Text style={styles.visibilityOptionText}>🔒 Riêng tư</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.submitBtn,
            (!content.trim() && mediaFiles.length === 0) || isSubmitting
              ? styles.submitBtnDisabled
              : {},
          ]}
          onPress={handleSubmit}
          disabled={
            (!content.trim() && mediaFiles.length === 0) || isSubmitting
          }>
          <Text style={styles.submitBtnText}>
            {isSubmitting ? 'Đang đăng...' : 'Đăng'}
          </Text>
        </TouchableOpacity>
      </View>
      {mediaFiles.length > 0 && (
        <View style={styles.mediaPreview}>
          {mediaFiles.map((file, index) => (
            <Text key={index} style={styles.mediaFileText}>
              {file.name}
            </Text>
          ))}
        </View>
      )}
      {error && <Text style={styles.errorMessage}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  createPostCard: {
    backgroundColor: '#083b38',
    borderRadius: 12,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#0e4420',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#0e4420',
  },
  textarea: {
    flex: 1,
    backgroundColor: 'transparent',
    color: '#d5e4c3',
    fontSize: 18,
    paddingTop: 10,
  },
  cardFooter: {
    marginTop: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    backgroundColor: '#0e4420',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#d5e4c3',
    fontWeight: '600',
  },
  visibilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  visibilityLabel: {
    color: '#a3b18a',
    marginRight: 8,
  },
  visibilitySelect: {
    flexDirection: 'row',
    backgroundColor: '#0e4420',
    borderRadius: 8,
    overflow: 'hidden',
  },
  visibilityOption: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  visibilityOptionSelected: {
    backgroundColor: '#1a5d48',
  },
  visibilityOptionText: {
    color: '#d5e4c3',
    fontSize: 12,
  },
  submitBtn: {
    backgroundColor: '#c1cd78',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  submitBtnDisabled: {
    backgroundColor: '#0e4420',
  },
  submitBtnText: {
    color: '#0e4420',
    fontWeight: 'bold',
  },
  mediaPreview: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#0e4420',
    borderStyle: 'dashed',
  },
  mediaFileText: {
    fontSize: 14,
    color: '#a3b18a',
    marginBottom: 5,
    backgroundColor: '#0e4420',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  errorMessage: {
    color: '#ff6b6b',
    marginTop: 10,
  },
});

export default CreatePost;
