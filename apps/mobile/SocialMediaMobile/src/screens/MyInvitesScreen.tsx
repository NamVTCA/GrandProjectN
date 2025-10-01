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
import { getInvites, joinGroup } from "../services/groupService";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { StackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<StackParamList, "MyInvites">;

export default function MyInvitesScreen({ route }: Props) {
  const { token } = route.params;
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvites = async () => {
    try {
      const data = await getInvites(token);
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

  // ✔️ Tham gia nhóm (BE chỉ cần gọi joinGroup)
  const handleAccept = async (groupId: string, inviteId: string) => {
    try {
      await joinGroup(groupId, token);
      Alert.alert("✅ Đã tham gia nhóm");
      setInvites((prev) => prev.filter((i) => i._id !== inviteId));
    } catch (err) {
      Alert.alert("❌ Lỗi", "Không thể tham gia nhóm");
    }
  };

  // ❌ Từ chối (BE chưa có API reject, FE chỉ remove khỏi list)
  const handleReject = (inviteId: string) => {
    setInvites((prev) => prev.filter((i) => i._id !== inviteId));
  };

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <FlatList
      data={invites}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View>
            <Text style={styles.groupName}>{item.group?.name}</Text>
            <Text style={styles.desc}>{item.group?.description}</Text>
          </View>
          <View style={styles.actions}>
            <Button
              title="✔️ Tham gia"
              onPress={() => handleAccept(item.group?._id, item._id)}
            />
            <Button
              title="❌ Từ chối"
              color="red"
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
    backgroundColor: "#fff",
    padding: 15,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  groupName: { fontSize: 16, fontWeight: "bold" },
  desc: { fontSize: 13, color: "#666" },
  actions: {
    flexDirection: "row",
    marginTop: 10,
    justifyContent: "space-around",
  },
});
