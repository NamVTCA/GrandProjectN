import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { forgotPassword } from "../services/authService";

import type { StackNavigationProp } from '@react-navigation/stack';

type ForgotPasswordScreenProps = {
  navigation: StackNavigationProp<any>;
};

export default function ForgotPasswordScreen({ navigation }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState("");

  const handleForgotPassword = async () => {
    try {
      const data = await forgotPassword(email);
      Alert.alert("Thành công", "Vui lòng kiểm tra email để đặt lại mật khẩu.");
      navigation.goBack();
    } catch (err: any) {
      Alert.alert("Lỗi", err.message || "Không thể gửi yêu cầu");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quên mật khẩu</Text>
      <TextInput style={styles.input} placeholder="Nhập email" value={email} onChangeText={setEmail} />
      <Button title="Gửi yêu cầu" onPress={handleForgotPassword} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, marginBottom: 15, borderRadius: 8 },
});
