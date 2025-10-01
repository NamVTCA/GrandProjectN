import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Button, FlatList, StyleSheet } from "react-native";
import { getComments, addComment } from "../services/postService";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { StackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<StackParamList, "Comments">;

export default function CommentScreen({ route, navigation }: Props) {
  const { postId, token } = route.params;
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const data = await getComments(postId);
        setComments(data);
      } catch (err) {
        console.log("Load comments failed:", err);
      }
    };
    fetchComments();
  }, [postId]);

  const handleAddComment = async () => {
    try {
      const comment = await addComment(postId, newComment, token);
      setComments((prev) => [...prev, comment]);
      setNewComment("");
    } catch (err) {
      console.log("Add comment failed:", err);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={comments}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.comment}>
            <Text style={styles.author}>{item.author?.username}</Text>
            <Text>{item.content}</Text>
          </View>
        )}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Viết bình luận..."
          value={newComment}
          onChangeText={setNewComment}
        />
        <Button title="Gửi" onPress={handleAddComment} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  comment: { padding: 10, borderBottomWidth: 1, borderColor: "#eee" },
  author: { fontWeight: "bold" },
  inputRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  input: { flex: 1, borderWidth: 1, borderColor: "#ccc", padding: 8, marginRight: 5, borderRadius: 8 },
});
