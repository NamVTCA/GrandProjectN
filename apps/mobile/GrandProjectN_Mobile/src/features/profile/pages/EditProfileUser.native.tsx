import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'react-native-image-picker';
import api from '../../../services/api';
import type { UserProfile } from '../types/UserProfile';

const EditProfileUser: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { username: paramUsername } = route.params as { username: string };

  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [avatarFile, setAvatarFile] = useState<any>(null);
  const [coverFile, setCoverFile] = useState<any>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!paramUsername) return;
    api
      .get<UserProfile>(`/users/${paramUsername}`)
      .then(res => setProfile(res.data))
      .catch(err => {
        console.error('GET /users/:username error', err);
        Alert.alert('Lỗi', 'Không tải được hồ sơ.');
      });
  }, [paramUsername]);

  const handleChange = (name: string, value: string) => {
    setProfile(prev => ({ ...prev, [name]: value }));

    if (name === 'username') {
      const len = value.trim().length;
      if (len < 6 || len > 12) {
        setNameError('Tên hiển thị phải từ 6 đến 12 ký tự');
      } else {
        setNameError(null);
      }
    }
  };

  const pickImage = (type: 'avatar' | 'cover') => {
    ImagePicker.launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
      },
      (response) => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert('Lỗi', 'Không thể chọn ảnh');
          return;
        }

        const asset = response.assets?.[0];
        if (!asset) return;

        if (type === 'avatar') {
          setAvatarFile(asset);
          setProfile(prev => ({ ...prev, avatar: asset.uri }));
        } else {
          setCoverFile(asset);
          setProfile(prev => ({ ...prev, coverImage: asset.uri }));
        }
      }
    );
  };

  const publicUrl = (path: string) =>
    path.startsWith('http') ? path : `http://localhost:8888${path}`;

  const handleSubmit = async () => {
    const nameLen = (profile.username?.trim().length ?? 0);
    if (nameLen < 6 || nameLen > 12) {
      Alert.alert('Lỗi', 'Tên hiển thị phải từ 6 đến 12 ký tự');
      return;
    }

    setLoading(true);
    try {
      await api.patch<UserProfile>(
        '/users/me',
        {
          username: profile.username,
          bio: profile.bio,
        }
      );

      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', {
          uri: avatarFile.uri,
          type: avatarFile.type,
          name: avatarFile.fileName || 'avatar.jpg',
        } as any); // 👈 ép kiểu để không bị TS báo lỗi

        await api.patch('/users/me/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      if (coverFile) {
        const formData = new FormData();
        formData.append('cover', {
          uri: coverFile.uri,
          type: coverFile.type,
          name: coverFile.fileName || 'cover.jpg',
        } as any); // 👈 ép kiểu

        await api.patch('/users/me/cover', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      navigation.goBack();
      Alert.alert('Thành công', 'Cập nhật hồ sơ thành công');
    } catch (err: any) {
      console.error('Profile update error', err.response || err);
      Alert.alert('Lỗi', `Cập nhật thất bại: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Chỉnh sửa hồ sơ</Text>
      
      <TouchableOpacity onPress={() => pickImage('cover')} style={styles.imagePicker}>
        <Text>Chọn ảnh bìa</Text>
        {profile.coverImage && (
          <Image
            source={{
              uri: profile.coverImage.startsWith('file:')
                ? profile.coverImage
                : publicUrl(profile.coverImage)
            }}
            style={styles.previewCover}
          />
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => pickImage('avatar')} style={styles.imagePicker}>
        <Text>Chọn avatar</Text>
        {profile.avatar && (
          <Image
            source={{
              uri: profile.avatar.startsWith('file:')
                ? profile.avatar
                : publicUrl(profile.avatar)
            }}
            style={styles.previewAvatar}
          />
        )}
      </TouchableOpacity>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Tên hiển thị</Text>
        <TextInput
          style={styles.input}
          value={profile.username || ''}
          onChangeText={(value) => handleChange('username', value)}
          maxLength={12}
        />
        {nameError && <Text style={styles.error}>{nameError}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Tiểu sử</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profile.bio || ''}
          onChangeText={(value) => handleChange('bio', value)}
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity 
          style={[styles.button, styles.saveButton, (!!nameError || loading) && styles.disabled]}
          onPress={handleSubmit}
          disabled={!!nameError || loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Đang lưu...' : 'Lưu'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.cancelButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Hủy</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1A1A1A',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  imagePicker: {
    marginBottom: 20,
    alignItems: 'center',
  },
  previewCover: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginTop: 10,
  },
  previewAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginTop: 10,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: 'white',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#333',
    color: 'white',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#555',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  error: {
    color: '#ff4757',
    marginTop: 5,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 20,
  },
  button: {
    padding: 15,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButton: {
    backgroundColor: '#555',
  },
  disabled: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default EditProfileUser;
