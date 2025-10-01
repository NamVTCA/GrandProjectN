import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { login, getMe } from "../services/authService";

import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { StackParamList } from "../navigation/types";

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<StackParamList, "Login">;
};

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      // 1. Đăng nhập -> lấy token
      const data = await login(email, password);
      const token = data.accessToken;
      console.log("Login success:", data);

      // 2. Gọi API lấy user từ token
      const user = await getMe(token);

      // 3. Kiểm tra interests
      if (!user.interests || user.interests.length === 0) {
        // Chưa có sở thích -> sang chọn sở thích
        navigation.replace("SelectInterests", { token, userId: user._id });
      } else {
        // Đã có sở thích -> sang Home
        navigation.replace("Home", { token });
      }
    } catch (err) {
      console.log("Login failed:", err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đăng nhập</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Mật khẩu"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Đăng nhập" onPress={handleLogin} />

      <TouchableOpacity onPress={() => navigation.navigate("Register")}>
        <Text style={styles.link}>Chưa có tài khoản? Đăng ký</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
        <Text style={styles.link}>Quên mật khẩu?</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 15,
    borderRadius: 8,
  },
  link: { marginTop: 10, color: "blue", textAlign: "center" },
});
