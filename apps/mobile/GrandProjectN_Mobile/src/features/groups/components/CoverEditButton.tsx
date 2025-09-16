import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import * as ImagePicker from "react-native-image-picker";
import api from "../../../services/api";

type Props = {
  groupId: string;
  onUploaded?: (newCoverImage: string) => void;
};

const CoverEditButton: React.FC<Props> = ({ groupId, onUploaded }) => {
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibrary({
        mediaType: "photo",
        quality: 0.8,
      });

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        await upload(file);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Lỗi", "Không thể chọn ảnh");
    }
  };

  const upload = async (file: any) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append(
        "file",
        {
          uri: file.uri,
          type: file.type,
          name: file.fileName || "image.jpg",
        } as any // 👈 ép kiểu để tránh lỗi TS
      );

      const res = await api.post(`/groups/${groupId}/cover-image`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const url = res.data?.coverImage;
      if (url) onUploaded?.(url);
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", "Tải ảnh thất bại. Thử lại nhé!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={pickImage}
      disabled={loading}
    >
      <Ionicons name="camera" size={16} style={{ marginRight: 6 }} />
      <Text style={styles.buttonText}>
        {loading ? "Đang tải..." : "Chỉnh sửa"}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
});

export default CoverEditButton;
