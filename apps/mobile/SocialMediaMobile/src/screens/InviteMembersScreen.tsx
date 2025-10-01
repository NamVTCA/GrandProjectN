import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Button,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { sendInvite } from "../services/groupService"; // ✅ dùng hàm có trong service

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { StackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<StackParamList, "InviteMembers">;

export default function InviteMembersScreen({ route }: Props) {
  const { token, groupId } = route.params;
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ⚠️ TODO: nếu BE có API getInviteCandidates thì thay URL này
  const fetchCandidates = async () => {
    try {
      const res = await fetch(`http://localhost:8888/groups/${groupId}/candidates`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setCandidates(data);
    } catch (err) {
      console.log("❌ Load invite candidates failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (userId: string) => {
    try {
      await sendInvite(groupId, [userId], token);
      Alert.alert("✅ Đã gửi lời mời");
      setCandidates((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      Alert.alert("❌ Lỗi", "Không thể gửi lời mời");
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <FlatList
      data={candidates}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.username}>{item.username}</Text>
          <Button title="Mời" onPress={() => handleInvite(item._id)} />
        </View>
      )}
      ListEmptyComponent={
        <Text style={{ padding: 20 }}>
          Không còn ai để mời vào nhóm này
        </Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  username: { fontSize: 15, fontWeight: "bold" },
});
