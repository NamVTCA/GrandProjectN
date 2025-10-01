import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Button, ActivityIndicator } from "react-native";
import { getMe } from "../services/authService";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { StackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<StackParamList, "Home">;

export default function HomeScreen({ route, navigation }: Props) {
  const { token } = route.params;
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getMe(token);
        setUser(data);
      } catch (err) {
        console.log("GetMe failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token]);

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Xin chào 👋</Text>
      {user ? (
        <>
          <Text>Email: {user.email}</Text>
          <Text>Username: {user.username}</Text>
        </>
      ) : (
        <Text>Không thể tải thông tin user</Text>
      )}

      <View style={styles.buttons}>
        <Button title="📰 Xem Feed" onPress={() => navigation.navigate("Feed", { token })} />
        <Button title="📌 Xem nhóm của bạn" onPress={() => navigation.navigate("GroupList", { token })} />
        <Button title="👤 Trang cá nhân" onPress={() => navigation.navigate("Profile", { token })} />
        <Button title="🚪 Đăng xuất" color="red" onPress={() => navigation.replace("Login")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 24, marginBottom: 20 },
  buttons: { marginTop: 30, width: "100%", gap: 10 },
});
