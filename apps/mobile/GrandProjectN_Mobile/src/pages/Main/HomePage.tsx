import React, { useState, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import apiClient from "../../api/apiClient";
import { Post } from "../../types";
import PostCard from "../../components/posts/PostCard";
import CreatePostModal from "../../components/posts/CreatePostModal"; // Import modal
import { colors, spacing, typography } from "../../styles/theme";

const HomePage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false); // State để quản lý modal

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/posts/feed");
      setPosts(response.data);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={({ item }) => <PostCard post={item} />}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: spacing.medium }}
        ListHeaderComponent={<Text style={styles.headerTitle}>Bảng tin</Text>}
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>Chưa có bài viết nào.</Text>
          </View>
        }
        onRefresh={fetchPosts}
        refreshing={loading}
      />

      {/* Nút bấm để mở Modal */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={30} color={colors.text} />
      </TouchableOpacity>

      {/* Modal tạo bài viết */}
      <CreatePostModal
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
        onPostCreated={fetchPosts} // Sau khi tạo bài viết thành công, gọi lại fetchPosts
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.large,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: spacing.medium,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    right: 30,
    bottom: 30,
    backgroundColor: colors.secondary,
    borderRadius: 30,
    elevation: 8,
  },
});

export default HomePage;
