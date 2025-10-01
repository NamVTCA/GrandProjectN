// src/screens/ProfileScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Button,
  Image,
  ScrollView,
} from "react-native";
import { getMe } from "../services/authService";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { StackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<StackParamList, "Profile">;

// Hàm tiện ích build URL file (bỏ /api đi)
const buildFileUrl = (path?: string) => {
  if (!path) return undefined;
  return `http://192.168.1.21:8888${path}`;
};

export default function ProfileScreen({ route, navigation }: Props) {
  const { token } = route.params;
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getMe(token);
        console.log("👉 User data:", data);
        setUser(data);
      } catch (err) {
        console.log("❌ GetMe failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token]);

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  const avatar = buildFileUrl(user?.avatar) || "https://i.pravatar.cc/200";
  const cover =
    buildFileUrl(user?.coverImage) || "https://picsum.photos/800/300";

  return (
    <ScrollView style={styles.container}>
      {/* Cover */}
      <Image source={{ uri: cover }} style={styles.cover} />

      {/* Avatar */}
      <View style={styles.avatarWrapper}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
      </View>

      {/* Info */}
      <View style={styles.infoWrapper}>
        <Text style={styles.username}>{user?.username}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {user?.bio && <Text style={styles.bio}>{user.bio}</Text>}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title="✏️ Chỉnh sửa hồ sơ"
          onPress={() => navigation.navigate("EditProfile", { token })}
        />
        <Button
          title="⬅️ Quay lại"
          color="#007bff"
          onPress={() => navigation.goBack()}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9" },
  cover: { width: "100%", height: 180 },
  avatarWrapper: {
    alignItems: "center",
    marginTop: -50,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#fff",
  },
  infoWrapper: { padding: 20, alignItems: "center" },
  username: { fontSize: 22, fontWeight: "bold" },
  email: { fontSize: 16, color: "#555", marginTop: 5 },
  bio: { fontSize: 15, marginTop: 10, fontStyle: "italic" },
  actions: {
    marginTop: 20,
    paddingHorizontal: 20,
    gap: 10,
  },
});
