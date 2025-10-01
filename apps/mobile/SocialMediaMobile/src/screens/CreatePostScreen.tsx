import React, { useState } from "react";
import { View, TextInput, Button, StyleSheet, Image, ScrollView, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { createPost, uploadFile } from "../services/postService";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { StackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<StackParamList, "CreatePost">;

export default function CreatePostScreen({ route, navigation }: Props) {
  const { token } = route.params;
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<any[]>([]);

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      setMedia(result.assets);
    }
  };

const handleSubmit = async () => {
  try {
    let uploadedUrls: string[] = [];

    for (const file of media) {
      const urls = await uploadFile(file.uri, token); // luôn trả về string[]
      console.log("✅ Upload success:", urls);
      uploadedUrls = [...uploadedUrls, ...urls];
    }

    console.log("📌 Gửi createPost với:", {
      content,
      uploadedUrls,
      token: token.substring(0, 15) + "...",
    });

    const post = await createPost(content, uploadedUrls, token);

    console.log("✅ CreatePost success:", post);

    Alert.alert("Thành công", "Bài viết đã được đăng!");
    navigation.goBack();
  } catch (err: any) {
    console.error("❌ CreatePost failed:", err);
    Alert.alert("Lỗi", `Không thể đăng bài: ${err.message || err}`);
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
        {media.map((m, i) => (
          <Image key={i} source={{ uri: m.uri }} style={styles.media} />
        ))}
      </View>
      <Button title="Đăng bài" onPress={handleSubmit} disabled={!content && media.length === 0} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, marginBottom: 15, borderRadius: 8, minHeight: 80 },
  preview: { marginVertical: 10 },
  media: { width: "100%", height: 200, marginTop: 5 },
});
