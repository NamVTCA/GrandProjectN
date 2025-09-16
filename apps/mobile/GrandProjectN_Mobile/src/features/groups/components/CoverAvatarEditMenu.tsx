import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import * as ImagePicker from "react-native-image-picker";
import api from "../../../services/api";

type Props = {
  groupId: string;
  onCoverUploaded?: (url: string) => void;
  onAvatarUploaded?: (url: string) => void;
};

const CoverAvatarEditMenu: React.FC<Props> = ({
  groupId,
  onCoverUploaded,
  onAvatarUploaded,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<null | "cover" | "avatar">(null);

  const pickImage = async (kind: "cover" | "avatar") => {
    try {
      const result = await ImagePicker.launchImageLibrary({
        mediaType: "photo",
        quality: 0.8,
      });

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        await upload(file, kind);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Lỗi", "Không thể chọn ảnh");
    }
  };

  const upload = async (file: any, kind: "cover" | "avatar") => {
    setLoading(kind);
    try {
      const formData = new FormData();
      formData.append(
        "file",
        {
          uri: file.uri,
          type: file.type,
          name: file.fileName || "image.jpg",
        } as any // 👈 ép kiểu
      );

      const url =
        kind === "cover"
          ? (
              await api.post(`/groups/${groupId}/cover-image`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
              })
            ).data?.coverImage
          : (
              await api.post(`/groups/${groupId}/avatar`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
              })
            ).data?.avatar;

      if (url) {
        if (kind === "cover") onCoverUploaded?.(url);
        else onAvatarUploaded?.(url);
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Lỗi", "Tải ảnh thất bại. Thử lại nhé!");
    } finally {
      setLoading(null);
      setOpen(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => setOpen((v) => !v)}
      >
        <Ionicons name="camera" size={16} style={{ marginRight: 6 }} />
        <Text style={styles.editButtonText}>Chỉnh sửa</Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.dropdown}>
          <TouchableOpacity
            style={styles.dropdownItem}
            onPress={() => pickImage("cover")}
            disabled={loading === "cover"}
          >
            <Text style={styles.dropdownItemText}>
              {loading === "cover" ? "Đang tải ảnh bìa..." : "Đổi ảnh bìa"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dropdownItem}
            onPress={() => pickImage("avatar")}
            disabled={loading === "avatar"}
          >
            <Text style={styles.dropdownItemText}>
              {loading === "avatar"
                ? "Đang tải avatar..."
                : "Đổi ảnh đại diện"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 6,
  },
  editButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    right: 0,
    backgroundColor: "#2A2A35",
    borderRadius: 6,
    padding: 4,
    marginTop: 4,
    minWidth: 150,
    zIndex: 10,
  },
  dropdownItem: {
    padding: 12,
  },
  dropdownItemText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
});

export default CoverAvatarEditMenu;
