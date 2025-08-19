import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, ActivityIndicator, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, RefreshControl } from 'react-native';
import axios from 'axios';
import { globalStyles, COLORS } from '../styles/theme';
import { useAuth } from '../features/auth/AuthContext';
import PostCard from '../components/PostCard';
import { Ionicons } from '@expo/vector-icons';

const PostDetailPage = ({ route, navigation }) => {
  const { postId } = route.params;
  const { token, logout } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchPostAndComments = useCallback(async () => {
    if (!token) return;
    setIsRefreshing(true);
    try {
      const postResponse = await axios.get(
        `http://192.168.20.107:8888/api/posts/${postId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPost(postResponse.data);

      const commentsResponse = await axios.get(
        `http://192.168.20.107:8888/api/posts/${postId}/comments`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments(commentsResponse.data);
    } catch (error) {
      if (error.response?.status === 401) {
        Alert.alert("Phiên làm việc đã hết hạn", "Vui lòng đăng nhập lại.");
        logout();
      } else {
        Alert.alert('Lỗi', 'Không thể tải bài viết. Vui lòng kiểm tra kết nối mạng.');
        console.error('Lỗi tải bài viết:', error);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [postId, token, logout, navigation]);

  useEffect(() => {
    fetchPostAndComments();
  }, [fetchPostAndComments]);

  const handleAddComment = async () => {
    if (!commentContent.trim()) {
      Alert.alert('Lỗi', 'Bình luận không được để trống.');
      return;
    }
    try {
      await axios.post(
        `http://192.168.20.107:8888/api/posts/${postId}/comments`,
        { content: commentContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCommentContent('');
      fetchPostAndComments();
    } catch (error) {
      console.error('Lỗi thêm bình luận:', error.response?.data);
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể thêm bình luận.');
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchPostAndComments();
  };

  const renderComment = ({ item }) => (
    <View style={styles.commentContainer}>
      <Text style={styles.commentAuthor}>{item.author.username}</Text>
      <Text style={styles.commentContent}>{item.content}</Text>
    </View>
  );

  if (loading && !isRefreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.mainContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <FlatList
        data={comments}
        renderItem={renderComment}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={() => (
          <View>
            {post && <PostCard post={post} />}
            <Text style={styles.commentsTitle}>Bình luận ({comments.length})</Text>
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      />

      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="Viết bình luận của bạn..."
          placeholderTextColor={COLORS.placeholder}
          value={commentContent}
          onChangeText={setCommentContent}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleAddComment}>
          <Ionicons name="send" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  commentsTitle: {
    ...globalStyles.title,
    fontSize: 20,
    marginTop: 10,
    paddingHorizontal: 15,
  },
  commentContainer: {
    ...globalStyles.card,
    marginHorizontal: 15,
    padding: 10,
    marginBottom: 5,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  commentAuthor: {
    fontWeight: 'bold',
    color: COLORS.text,
  },
  commentContent: {
    color: COLORS.text,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  commentInput: {
    flex: 1,
    height: 40,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    color: COLORS.text,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PostDetailPage;