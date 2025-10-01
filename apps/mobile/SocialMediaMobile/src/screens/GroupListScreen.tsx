// src/screens/GroupListScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Button,
} from "react-native";
import { getMyGroups } from "../services/groupService";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { StackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<StackParamList, "GroupList">;

// ✅ Helper build URL file từ BE
const buildFileUrl = (path?: string) => {
  if (!path) return undefined;
  return `http://192.168.1.21:8888${path}`; // ⚠️ thay IP LAN của bạn
};

export default function GroupListScreen({ route, navigation }: Props) {
  const { token } = route.params;
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const data = await getMyGroups(token);
        console.log("✅ Groups:", data);
        setGroups(data);
      } catch (err) {
        console.log("❌ Load groups failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, [token]);

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <Button
        title="➕ Tạo nhóm mới"
        onPress={() => navigation.navigate("CreateGroup", { token })}
      />
      <FlatList
        data={groups}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate("GroupDetail", { groupId: item._id, token })
            }
          >
            <Image
              source={{
                uri:
                  buildFileUrl(item.avatar) ||
                  "https://via.placeholder.com/80x80.png?text=Group",
              }}
              style={styles.avatar}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>
                {(item.members?.length || 0)} thành viên · {item.visibility}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 20 }}>
            Bạn chưa tham gia nhóm nào
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: "#f0f2f5" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2,
  },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 10 },
  name: { fontSize: 16, fontWeight: "bold" },
  meta: { fontSize: 13, color: "#666", marginTop: 2 },
});
