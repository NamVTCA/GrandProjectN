import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Button,
  Alert,
} from "react-native";
import {
  getFeed,
  reactToPost,
  deletePost,
} from "../services/postService"; // ⚠️ nhớ implement deletePost trong postService
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { StackParamList } from "../navigation/types";
import PostCard from "../components/PostCard";

type Props = NativeStackScreenProps<StackParamList, "Feed">;

export default function FeedScreen({ route, navigation }: Props) {
  const { token } = route.params;
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeed = async () => {
    try {
      const data = await getFeed(token);
      setPosts(data);
    } catch (err) {
      console.log("Load feed failed:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [token]);

  const handleReact = async (postId: string, type: string) => {
    try {
      await reactToPost(postId, type, token);
      if (type === "REPOST") {
        Alert.alert("✅ Đã chia sẻ", "Bài viết đã được chia sẻ lại");
      }
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? { ...p, reactions: [...(p.reactions || []), { type }] }
            : p
        )
      );
    } catch (err) {
      console.log("React failed:", err);
    }
  };

  const handleDelete = async (postId: string) => {
    Alert.alert("Xóa bài viết", "Bạn có chắc muốn xóa bài viết này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await deletePost(postId, token);
            setPosts((prev) => prev.filter((p) => p._id !== postId));
          } catch (err) {
            Alert.alert("❌ Lỗi", "Không thể xóa bài viết");
          }
        },
      },
    ]);
  };

  const handleEdit = (post: any) => {
    navigation.navigate("EditPost", { post, token });
  };

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item._id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={fetchFeed} />
      }
      ListHeaderComponent={
        <View style={{ padding: 10 }}>
          <Button
            title="✍️ Tạo bài viết"
            onPress={() => navigation.navigate("CreatePost", { token })}
          />
        </View>
      }
      renderItem={({ item }) => (
        <PostCard
          post={item}
          onReact={(type) => handleReact(item._id, type)}
          onComment={() =>
            navigation.navigate("Comments", { postId: item._id, token })
          }
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      )}
      contentContainerStyle={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 20, backgroundColor: "#f0f2f5" },
});
