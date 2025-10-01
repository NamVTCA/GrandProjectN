import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Button,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  getGroupMembers,
  removeMember,
} from "../services/groupService";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { StackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<StackParamList, "GroupMembers">;

export default function GroupMembersScreen({ route }: Props) {
  const { token, groupId, isAdmin } = route.params;
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = async () => {
    try {
      const data = await getGroupMembers(groupId, token);
      setMembers(data);
    } catch (err) {
      console.log("❌ Load members failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleRemove = async (memberId: string) => {
    try {
      await removeMember(groupId, memberId, token);
      Alert.alert("✅ Đã xoá thành viên");
      fetchMembers();
    } catch (err) {
      Alert.alert("❌ Lỗi", "Không thể xoá thành viên");
    }
  };

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <FlatList
      data={members}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.username}>{item.user?.username}</Text>
          <Text style={styles.role}>
            {item.role === "ADMIN" ? "👑 Admin" : "👤 Thành viên"}
          </Text>
          {isAdmin && item.role !== "ADMIN" && (
            <Button
              title="Xoá"
              color="red"
              onPress={() => handleRemove(item.user?._id)}
            />
          )}
        </View>
      )}
      ListEmptyComponent={
        <Text style={{ padding: 20 }}>Chưa có thành viên nào</Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#eee",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  username: { fontSize: 15, fontWeight: "bold" },
  role: { fontSize: 13, color: "#666" },
});
