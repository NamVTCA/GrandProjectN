import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import { globalStyles, COLORS } from '../styles/theme';
import { useAuth } from '../features/auth/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const PostVisibility = {
  PUBLIC: 'PUBLIC',
  FRIENDS_ONLY: 'FRIENDS_ONLY',
  PRIVATE: 'PRIVATE',
};

const CreatePost = ({ onPostCreated }) => {
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState(PostVisibility.PUBLIC);
  const { token, user } = useAuth();
  const avatarUrl = user?.avatar ? `http://192.168.20.107:8888/${user.avatar}` : 'https://via.placeholder.com/150';

  const handleCreatePost = async () => {
    if (!content.trim()) {
      Alert.alert('Lỗi', 'Nội dung bài viết không được để trống.');
      return;
    }
    try {
      await axios.post(
        `http://192.168.20.107:8888/api/posts`,
        { content, visibility },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setContent('');
      setVisibility(PostVisibility.PUBLIC);
      Alert.alert('Thành công', 'Bài viết của bạn đã được đăng.');
      if (onPostCreated) {
        onPostCreated();
      }
    } catch (error) {
      console.error('Lỗi tạo bài viết:', error.response?.data);
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể tạo bài viết.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Bạn đang nghĩ gì?"
            placeholderTextColor={COLORS.placeholder}
            value={content}
            onChangeText={setContent}
            multiline
          />
        </View>
      </View>
      <View style={styles.footer}>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={visibility}
            style={styles.picker}
            onValueChange={(itemValue) => setVisibility(itemValue)}
          >
            <Picker.Item label="Công khai" value={PostVisibility.PUBLIC} />
            <Picker.Item label="Chỉ bạn bè" value={PostVisibility.FRIENDS_ONLY} />
            <Picker.Item label="Riêng tư" value={PostVisibility.PRIVATE} />
          </Picker>
        </View>
        <TouchableOpacity style={styles.postButton} onPress={handleCreatePost}>
          <Ionicons name="send" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...globalStyles.card,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  inputContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    backgroundColor: COLORS.background,
  },
  input: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: COLORS.text,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  pickerContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  picker: {
    height: 40,
    width: 150,
    color: COLORS.text,
  },
  postButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CreatePost;