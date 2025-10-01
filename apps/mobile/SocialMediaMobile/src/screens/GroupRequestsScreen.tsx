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
  getRequests,
  approveRequest,
  rejectRequest,
} from "../services/groupService"; // ✅ đổi đúng tên hàm

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { StackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<StackParamList, "GroupRequests">;

export default function GroupRequestsScreen({ route }: Props) {
  const { groupId, token } = route.params;
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const data = await getRequests(groupId, token); // ✅ dùng đúng hàm
      setRequests(data);
    } catch (err) {
      console.log("❌ Load requests failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [groupId]);

  const handleApprove = async (reqId: string) => {
    try {
      await approveRequest(groupId, reqId, token); // ✅ dùng đúng hàm
      Alert.alert("✅ Đã chấp nhận yêu cầu");
      fetchRequests();
    } catch (err) {
      Alert.alert("❌ Lỗi", "Không thể chấp nhận");
    }
  };

  const handleReject = async (reqId: string) => {
    try {
      await rejectRequest(groupId, reqId, token); // ✅ dùng đúng hàm
      Alert.alert("✅ Đã từ chối yêu cầu");
      fetchRequests();
    } catch (err) {
      Alert.alert("❌ Lỗi", "Không thể từ chối");
    }
  };

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <FlatList
      data={requests}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.username}>{item.user?.username}</Text>
          <View style={styles.actions}>
            <Button title="✅ Chấp nhận" onPress={() => handleApprove(item._id)} />
            <Button title="❌ Từ chối" onPress={() => handleReject(item._id)} />
          </View>
        </View>
      )}
      ListEmptyComponent={
        <Text style={{ padding: 20 }}>Không có yêu cầu tham gia nào</Text>
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
  actions: { flexDirection: "row", gap: 10 },
});
