import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { createGroup } from "../services/groupService";
import { getInterests } from "../services/interestService";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { StackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<StackParamList, "CreateGroup">;

export default function CreateGroupScreen({ route, navigation }: Props) {
  const { token } = route.params;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [interests, setInterests] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchInterests = async () => {
      try {
        const data = await getInterests(token);
        setInterests(data);
      } catch (err) {
        console.log("❌ Load interests failed:", err);
      }
    };
    fetchInterests();
  }, [token]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("⚠️ Lỗi", "Tên nhóm không được để trống");
      return;
    }

    try {
      await createGroup({ name, description, interestIds: selectedIds, visibility }, token);
      Alert.alert("✅ Thành công", "Nhóm đã được tạo");
      navigation.goBack();
    } catch (err: any) {
      console.log("❌ CreateGroup failed:", err);
      Alert.alert("❌ Lỗi", err.message || "Không thể tạo nhóm");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Tên nhóm"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={[styles.input, { height: 100 }]}
        placeholder="Mô tả nhóm"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Text style={styles.label}>Chọn chế độ nhóm</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[
            styles.option,
            visibility === "PUBLIC" && styles.selectedOption,
          ]}
          onPress={() => setVisibility("PUBLIC")}
        >
          <Text>🌍 Công khai</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.option,
            visibility === "PRIVATE" && styles.selectedOption,
          ]}
          onPress={() => setVisibility("PRIVATE")}
        >
          <Text>🔒 Riêng tư</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Chọn sở thích</Text>
      {interests.map((item) => (
        <TouchableOpacity
          key={item._id}
          style={[
            styles.interestItem,
            selectedIds.includes(item._id) && styles.selected,
          ]}
          onPress={() => toggleSelect(item._id)}
        >
          <Text>{item.name}</Text>
        </TouchableOpacity>
      ))}

      <Button title="Tạo nhóm" onPress={handleCreate} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 15,
    borderRadius: 8,
    fontSize: 16,
  },
  label: { fontWeight: "bold", marginTop: 15, marginBottom: 8 },
  row: { flexDirection: "row", marginBottom: 15 },
  option: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    alignItems: "center",
    marginRight: 10,
  },
  selectedOption: { backgroundColor: "#cce5ff", borderColor: "#007bff" },
  interestItem: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 8,
  },
  selected: { backgroundColor: "#cce5ff", borderColor: "#007bff" },
});
