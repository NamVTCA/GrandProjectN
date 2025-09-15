import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Image,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "../../styles/theme";
import apiClient from "../../api/apiClient";

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onPostCreated: () => void; // Callback để làm mới feed
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({
  visible,
  onClose,
  onPostCreated,
}) => {
  const [content, setContent] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleCreatePost = async () => {
    if (!content.trim()) {
      Alert.alert("Nội dung không được để trống");
      return;
    }
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("content", content);

    if (image) {
      const uriParts = image.split(".");
      const fileType = uriParts[uriParts.length - 1];
      formData.append("media", {
        uri: image,
        name: `photo.${fileType}`,
        type: `image/${fileType}`,
      } as any);
    }

    try {
      await apiClient.post("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Reset state và đóng modal
      setContent("");
      setImage(null);
      onPostCreated(); // Gọi callback để tải lại feed
      onClose();
    } catch (error) {
      console.error("Failed to create post:", error);
      Alert.alert("Lỗi", "Không thể tạo bài viết.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Tạo bài viết</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Bạn đang nghĩ gì?"
            placeholderTextColor={colors.textSecondary}
            value={content}
            onChangeText={setContent}
            multiline
          />
          {image && (
            <Image source={{ uri: image }} style={styles.previewImage} />
          )}
          <View style={styles.actions}>
            <TouchableOpacity onPress={pickImage} style={styles.actionButton}>
              <Ionicons name="image" size={24} color={colors.success} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.postButton}
              onPress={handleCreatePost}
              disabled={isSubmitting}
            >
              <Text style={styles.postButtonText}>Đăng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: spacing.medium,
    borderTopRightRadius: spacing.medium,
    padding: spacing.medium,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.medium,
  },
  title: { ...typography.h1 },
  input: {
    height: 120,
    textAlignVertical: "top",
    color: colors.text,
    fontSize: 18,
    marginBottom: spacing.medium,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: spacing.small,
    marginBottom: spacing.medium,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionButton: { padding: spacing.small },
  postButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.small,
    paddingHorizontal: spacing.large,
    borderRadius: 20,
  },
  postButtonText: { ...typography.body, fontWeight: "bold" },
});

export default CreatePostModal;
