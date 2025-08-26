import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Platform,
  RefreshControl,
  KeyboardAvoidingView,
} from "react-native";
import axios from "axios";
import { globalStyles, COLORS } from "../styles/theme";
import { useAuth } from "../features/auth/AuthContext";
import PostCard from "../components/PostCard";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareFlatList } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const PostDetailPage = ({ route }) => {
  const { postId } = route.params;
  const { token, logout } = useAuth();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const insets = useSafeAreaInsets(); // để chừa chỗ dưới cho nav bar

  const fetchPostAndComments = useCallback(async () => {
    if (!token) return;
    setIsRefreshing(true);
    try {
      const postResponse = await axios.get(
        `http://192.168.20.34:8888/api/posts/${postId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPost(postResponse.data);

      const commentsResponse = await axios.get(
        `http://192.168.20.34:8888/api/posts/${postId}/comments`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments(Array.isArray(commentsResponse.data) ? commentsResponse.data : []);
    } catch (error) {
      if (error.response?.status === 401) {
        Alert.alert("Phiên làm việc đã hết hạn", "Vui lòng đăng nhập lại.");
        logout();
      } else {
        console.error("Lỗi tải bài viết:", error);
        Alert.alert("Lỗi", "Không thể tải bài viết. Vui lòng kiểm tra kết nối mạng.");
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [postId, token, logout]);

  useEffect(() => {
    fetchPostAndComments();
  }, [fetchPostAndComments]);

  // Gửi bình luận: cập nhật UI ngay (prepend), nếu server trả comment mới thì dùng res.data
  const handleAddComment = async () => {
    if (!commentContent.trim()) {
      Alert.alert("Lỗi", "Bình luận không được để trống.");
      return;
    }

    try {
      const res = await axios.post(
        `http://192.168.20.34:8888/api/posts/${postId}/comments`,
        { content: commentContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Nếu API trả về comment mới, dùng nó; nếu không, tạo local fallback
      const newComment = res?.data
        ? res.data
        : {
            _id: Date.now().toString(),
            content: commentContent,
            author: { username: "Bạn" },
          };

      setComments(prev => [newComment, ...prev]);
      setCommentContent("");
      // không gọi lại toàn bộ API để UI mượt; nếu muốn verify, có thể fetchPostAndComments()
    } catch (error) {
      console.error("Lỗi thêm bình luận:", error.response?.data || error.message);
      Alert.alert("Lỗi", error.response?.data?.message || "Không thể thêm bình luận.");
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchPostAndComments();
  };

  const renderComment = ({ item }) => (
    <View style={styles.commentContainer}>
      <Text style={styles.commentAuthor}>{item?.author?.username ?? "Ẩn danh"}</Text>
      <Text style={styles.commentContent}>{item?.content ?? ""}</Text>
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
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {/* List bình luận (không bọc KeyboardAvoidingView toàn màn) */}
      <KeyboardAwareFlatList
        data={comments}
        renderItem={renderComment}
        keyExtractor={(item, index) => (item && item._id ? String(item._id) : String(index))}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }} // chừa chỗ cho input + safe area
        ListHeaderComponent={() => (
          <View style={{ paddingBottom: 10 }}>
            {post && <PostCard post={post} />}
            <Text style={styles.commentsTitle}>Bình luận ({comments.length})</Text>
          </View>
        )}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        extraScrollHeight={Platform.OS === "android" ? 120 : 60}
      />

      {/* Chỉ bọc thanh input bằng KeyboardAvoidingView => khi bàn phím bật, chỉ thanh input nhảy lên */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <View style={[styles.commentInputContainer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <TextInput
            style={styles.commentInput}
            placeholder="Viết bình luận của bạn..."
            placeholderTextColor={COLORS.placeholder}
            value={commentContent}
            onChangeText={setCommentContent}
            multiline
            returnKeyType="send"
            onSubmitEditing={handleAddComment}
            blurOnSubmit={false}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleAddComment}>
            <Ionicons name="send" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    marginBottom: 8,
  },
  commentAuthor: {
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  commentContent: {
    color: COLORS.text,
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  commentInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 140,
    backgroundColor: COLORS.background,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: COLORS.text,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default PostDetailPage;
