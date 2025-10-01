import React, { useState } from "react";
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { updatePost, uploadFile } from "../services/postService";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { StackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<StackParamList, "EditPost">;

export default function EditPostScreen({ route, navigation }: Props) {
  const { post, token } = route.params;
  const [content, setContent] = useState(post.content || "");
  const [media, setMedia] = useState<any[]>(
    (post.mediaUrls || []).map((url: string) => ({ uri: url }))
  );

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      setMedia([...media, ...result.assets]);
    }
  };

  const handleSubmit = async () => {
    try {
      let uploadedUrls: string[] = [];

      for (const file of media) {
        if (file.uri.startsWith("http")) {
          // ảnh/video cũ giữ nguyên
          uploadedUrls.push(file.uri);
        } else {
          const urls = await uploadFile(file.uri, token); // luôn trả về string[]
          uploadedUrls = [...uploadedUrls, ...urls];
        }
      }

      await updatePost(post._id, content, uploadedUrls, token);
      Alert.alert("✅ Thành công", "Bài viết đã được cập nhật");
      navigation.goBack();
    } catch (err: any) {
      console.error("❌ UpdatePost failed:", err);
      Alert.alert("❌ Lỗi", "Không thể cập nhật bài viết");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Bạn đang nghĩ gì?"
        value={content}
        onChangeText={setContent}
        multiline
      />
      <Button title="Chọn ảnh/video" onPress={pickMedia} />
      <View style={styles.preview}>
        {media.map((m, i) =>
          m.uri.endsWith(".mp4") ? (
            <Image
              key={i}
              source={{ uri: "https://via.placeholder.com/150?text=Video" }}
              style={styles.media}
            />
          ) : (
            <Image key={i} source={{ uri: m.uri }} style={styles.media} />
          )
        )}
      </View>
      <Button
        title="💾 Lưu thay đổi"
        onPress={handleSubmit}
        disabled={!content && media.length === 0}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 15,
    borderRadius: 8,
    minHeight: 80,
  },
  preview: { marginVertical: 10 },
  media: { width: "100%", height: 200, marginTop: 5, borderRadius: 8 },
});
