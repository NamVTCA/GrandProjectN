import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import axios from "axios";
import { globalStyles, COLORS } from "../styles/theme";
import { useAuth } from "../features/auth/AuthContext";
import { Ionicons } from "@expo/vector-icons";

const PostVisibility = {
  PUBLIC: "PUBLIC",
  FRIENDS_ONLY: "FRIENDS_ONLY",
  PRIVATE: "PRIVATE",
};

const visibilityOptions = [
  { label: "Công khai", value: PostVisibility.PUBLIC, icon: "earth-outline" },
  { label: "Bạn bè", value: PostVisibility.FRIENDS_ONLY, icon: "people-outline" },
  { label: "Riêng tư", value: PostVisibility.PRIVATE, icon: "lock-closed-outline" },
];

const CreatePost = ({ onPostCreated }) => {
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState(PostVisibility.PUBLIC);
  const [modalVisible, setModalVisible] = useState(false);
  const { token, user } = useAuth();

  const avatarUrl = user?.avatar
    ? `http://192.168.20.34:8888/${user.avatar}`
    : "https://via.placeholder.com/150";

  const handleCreatePost = async () => {
    if (!content.trim()) {
      Alert.alert("Lỗi", "Nội dung bài viết không được để trống.");
      return;
    }
    try {
      await axios.post(
        `http://192.168.20.34:8888/api/posts`,
        { content, visibility },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setContent("");
      setVisibility(PostVisibility.PUBLIC);
      Alert.alert("Thành công", "Bài viết của bạn đã được đăng.");
      if (onPostCreated) {
        onPostCreated();
      }
    } catch (error) {
      console.error("Lỗi tạo bài viết:", error.response?.data);
      Alert.alert(
        "Lỗi",
        error.response?.data?.message || "Không thể tạo bài viết."
      );
    }
  };

  // Lấy option hiện tại
  const currentOption = visibilityOptions.find((opt) => opt.value === visibility);

  return (
    <View style={styles.container}>
      {/* Header nhập bài viết */}
      <View style={styles.header}>
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Bạn đang nghĩ gì?"
            placeholderTextColor={COLORS.placeholder}
            value={content}
            onChangeText={setContent}
            multiline
          />
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.postMediaOptions}>
          <TouchableOpacity style={styles.mediaButton}>
            <Ionicons name="image-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.mediaButton}>
            <Ionicons name="videocam-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.postOptions}>
          {/* Nút chọn quyền riêng tư */}
          <TouchableOpacity
            style={styles.visibilityButton}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons
              name={currentOption.icon}
              size={18}
              color={COLORS.text}
              style={{ marginRight: 4 }}
            />
            <Text style={{ color: COLORS.text, fontSize: 14 }}>
              {currentOption.label}
            </Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color={COLORS.text}
              style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>

          {/* Nút đăng */}
          <TouchableOpacity style={styles.postButton} onPress={handleCreatePost}>
            <Ionicons name="send" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal chọn quyền riêng tư */}
      <Modal
        transparent
        animationType="fade"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            {visibilityOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.optionRow}
                onPress={() => {
                  setVisibility(option.value);
                  setModalVisible(false);
                }}
              >
                <Ionicons
                  name={option.icon}
                  size={20}
                  color={COLORS.primary}
                  style={{ marginRight: 8 }}
                />
                <Text style={{ color: COLORS.text, fontSize: 15 }}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...globalStyles.card,
    marginBottom: 20,
    padding: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  inputContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 15,
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 60,
  },
  input: {
    color: COLORS.text,
    fontSize: 15,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  postMediaOptions: {
    flexDirection: "row",
    alignItems: "center",
  },
  mediaButton: {
    padding: 8,
    marginRight: 10,
    backgroundColor: COLORS.background,
    borderRadius: 10,
  },
  postOptions: {
    flexDirection: "row",
    alignItems: "center",
  },
  visibilityButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginRight: 10,
    backgroundColor: COLORS.card,
  },
  postButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    width: 220,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
});

export default CreatePost;
