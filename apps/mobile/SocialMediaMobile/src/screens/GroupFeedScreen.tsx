import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  ActivityIndicator,
  Button,
  StyleSheet,
  Text,
} from "react-native";
import { getGroupPosts } from "../services/groupService";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { StackParamList } from "../navigation/types";
import PostCard from "../components/PostCard";

type Props = NativeStackScreenProps<StackParamList, "GroupFeed">;

export default function GroupFeedScreen({ route, navigation }: Props) {
  const { token, groupId } = route.params;
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      const data = await getGroupPosts(groupId, token);
      setPosts(data);
    } catch (err) {
      console.log("❌ Load group posts failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [groupId]);

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item._id}
      ListHeaderComponent={
        <View style={styles.header}>
          <Button
            title="✍️ Đăng bài trong nhóm"
            onPress={() =>
              navigation.navigate("CreatePost", { token, groupId })
            }
          />
        </View>
      }
      renderItem={({ item }) => (
        <PostCard
          post={item}
          onReact={(type) => console.log("React:", type)}
          onComment={() =>
            navigation.navigate("Comments", { postId: item._id, token })
          }
        />
      )}
      ListEmptyComponent={
        <Text style={{ padding: 20 }}>Chưa có bài viết nào trong nhóm</Text>
      }
      contentContainerStyle={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 20, backgroundColor: "#f0f2f5" },
  header: { padding: 10 },
});
