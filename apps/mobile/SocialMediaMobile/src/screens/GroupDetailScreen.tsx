import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Button,
  Alert,
} from "react-native";
import {
  getGroupById,
  getGroupPosts,
  joinGroup,
  leaveGroup,
} from "../services/groupService";
import PostCard from "../components/PostCard";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { StackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<StackParamList, "GroupDetail">;

export default function GroupDetailScreen({ route, navigation }: Props) {
  const { groupId, token } = route.params;
  const [group, setGroup] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const g = await getGroupById(groupId, token);
      const p = await getGroupPosts(groupId, token);
      setGroup(g);
      setPosts(p);
    } catch (err) {
      console.log("❌ Load group detail failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [groupId]);

  const handleJoin = async () => {
    try {
      await joinGroup(groupId, token);
      Alert.alert(
        "✅ Thành công",
        group.visibility === "PRIVATE"
          ? "Yêu cầu tham gia đã được gửi"
          : "Bạn đã tham gia nhóm"
      );
      fetchData();
    } catch (err) {
      Alert.alert("❌ Lỗi", "Không thể tham gia nhóm");
    }
  };

  const handleLeave = async () => {
    try {
      await leaveGroup(groupId, token);
      Alert.alert("✅ Thành công", "Bạn đã rời nhóm");
      navigation.goBack();
    } catch (err) {
      Alert.alert("❌ Lỗi", "Không thể rời nhóm");
    }
  };

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  if (!group)
    return (
      <View style={styles.container}>
        <Text>Không tìm thấy nhóm</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      {/* Header group */}
      <View style={styles.header}>
        <Text style={styles.name}>{group.name}</Text>
        <Text style={styles.meta}>
          {group.memberCount || 0} thành viên ·{" "}
          {group.visibility === "PUBLIC" ? "Công khai" : "Riêng tư"}
        </Text>
        <Text style={styles.meta}>
          Sở thích: {group.interests?.map((i: any) => i.name).join(", ") || "—"}
        </Text>

        {group.isMember ? (
          <Button title="🚪 Rời nhóm" onPress={handleLeave} />
        ) : (
          <Button
            title={
              group.visibility === "PUBLIC"
                ? "➕ Tham gia nhóm"
                : "📩 Gửi yêu cầu tham gia"
            }
            onPress={handleJoin}
          />
        )}
      </View>

      {group.isMember ? (
        <>
          <Button
            title="✍️ Đăng bài trong nhóm"
            onPress={() => navigation.navigate("CreatePost", { token, groupId })}
          />
          <FlatList
            data={posts}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <PostCard
                post={item}
                onReact={(type) => console.log("React", type)}
                onComment={() =>
                  navigation.navigate("Comments", { postId: item._id, token })
                }
              />
            )}
            ListEmptyComponent={<Text>Chưa có bài viết nào trong nhóm</Text>}
          />
        </>
      ) : (
        <Text style={{ padding: 20 }}>
          👉 Bạn cần tham gia nhóm để xem bài viết.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f2f5" },
  header: { padding: 15, backgroundColor: "#fff", marginBottom: 10 },
  name: { fontSize: 18, fontWeight: "bold" },
  meta: { fontSize: 13, color: "#666", marginTop: 4 },
});
