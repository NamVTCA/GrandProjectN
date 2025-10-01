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
import { getInvites, joinGroup } from "../services/groupService"; // ✅ sửa lại import

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { StackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<StackParamList, "GroupInvites">;

export default function GroupInvitesScreen({ route }: Props) {
  const { token } = route.params;
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvites = async () => {
    try {
      const data = await getInvites(token); // ✅ gọi đúng hàm
      setInvites(data);
    } catch (err) {
      console.log("❌ Load invites failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, []);

  const handleAccept = async (invite: any) => {
    try {
      await joinGroup(invite.group._id, token); // ✅ tham gia nhóm
      Alert.alert("✅ Bạn đã tham gia nhóm");
      fetchInvites();
    } catch (err) {
      Alert.alert("❌ Lỗi", "Không thể chấp nhận lời mời");
    }
  };

  const handleReject = async (inviteId: string) => {
    try {
      // Nếu BE chưa có API reject thì chỉ cần xóa local
      setInvites((prev) => prev.filter((i) => i._id !== inviteId));
      Alert.alert("✅ Đã từ chối lời mời");
    } catch (err) {
      Alert.alert("❌ Lỗi", "Không thể từ chối lời mời");
    }
  };

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <FlatList
      data={invites}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View>
            <Text style={styles.group}>{item.group?.name}</Text>
            <Text style={styles.inviter}>
              Mời bởi: {item.inviter?.username}
            </Text>
          </View>
          <View style={styles.actions}>
            <Button title="✅ Chấp nhận" onPress={() => handleAccept(item)} />
            <Button
              title="❌ Từ chối"
              onPress={() => handleReject(item._id)}
            />
          </View>
        </View>
      )}
      ListEmptyComponent={
        <Text style={{ padding: 20 }}>Bạn chưa có lời mời nào</Text>
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
  group: { fontSize: 15, fontWeight: "bold" },
  inviter: { fontSize: 13, color: "#666" },
  actions: { flexDirection: "row", gap: 10 },
});
