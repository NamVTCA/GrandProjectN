import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from "react-native";
import { Video, ResizeMode } from "expo-av";

type Props = {
  post: any;
  onReact: (type: string) => void;
  onComment: () => void;
  onDelete?: (id: string) => void;
  onEdit?: (post: any) => void;
};

const REACTIONS = [
  { type: "LIKE", emoji: "👍", label: "Thích" },
  { type: "LOVE", emoji: "❤️", label: "Yêu thích" },
  { type: "HAHA", emoji: "😆", label: "Haha" },
  { type: "WOW", emoji: "😮", label: "Wow" },
  { type: "SAD", emoji: "😢", label: "Buồn" },
  { type: "ANGRY", emoji: "😡", label: "Phẫn nộ" },
];

export default function PostCard({
  post,
  onReact,
  onComment,
  onDelete,
  onEdit,
}: Props) {
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const avatar = post.author?.avatarUrl || "https://i.pravatar.cc/100";
  const username = post.author?.username || "Người dùng";
  const createdAt = new Date(post.createdAt).toLocaleString("vi-VN");

  // ✅ lấy reaction của currentUser nếu có
  const myReaction = post.reactions?.find(
    (r: any) => r.userId === "me" // TODO: thay bằng userId thực tế
  );

  const currentReaction =
    REACTIONS.find((r) => r.type === myReaction?.type) || null;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.username}>{username}</Text>
          <Text style={styles.time}>{createdAt}</Text>
        </View>

        {/* Menu ⋯ chỉ hiển thị nếu là chủ bài */}
        {post.isOwner && (
          <TouchableOpacity onPress={() => setShowMenu(true)}>
            <Text style={{ fontSize: 20 }}>⋯</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Nội dung */}
      {post.content ? <Text style={styles.content}>{post.content}</Text> : null}

      {/* Media */}
      {post.mediaUrls?.map((url: string, index: number) =>
        url.endsWith(".mp4") ? (
          <Video
            key={index}
            source={{ uri: url }}
            style={styles.media}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
          />
        ) : (
          <Image key={index} source={{ uri: url }} style={styles.media} />
        )
      )}

      {/* Meta */}
      <Text style={styles.meta}>
        ❤️ {post.reactions?.length || 0} · 💬 {post.commentCount || 0}
      </Text>

      {/* Comment preview */}
      {post.latestComments?.length > 0 && (
        <View style={styles.commentPreview}>
          {post.latestComments.slice(0, 2).map((c: any) => (
            <Text key={c._id} style={styles.commentText}>
              <Text style={styles.commentAuthor}>{c.author?.username}: </Text>
              {c.content}
            </Text>
          ))}
          {post.commentCount > 2 && (
            <TouchableOpacity onPress={onComment}>
              <Text style={styles.viewMore}>Xem thêm bình luận...</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {/* Like / Reaction */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() =>
            onReact(myReaction ? myReaction.type : "LIKE")
          }
          onLongPress={() => setShowReactions(true)}
        >
          <Text
            style={[
              styles.actionText,
              currentReaction && { color: "#1877f2", fontWeight: "bold" },
            ]}
          >
            {currentReaction
              ? `${currentReaction.emoji} ${currentReaction.label}`
              : "👍 Thích"}
          </Text>
        </TouchableOpacity>

        {/* Comment */}
        <TouchableOpacity style={styles.actionBtn} onPress={onComment}>
          <Text style={styles.actionText}>💬 Bình luận</Text>
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onReact("REPOST")}
        >
          <Text style={styles.actionText}>🔄 Chia sẻ</Text>
        </TouchableOpacity>
      </View>

      {/* Reaction Picker */}
      <Modal
        visible={showReactions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReactions(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setShowReactions(false)}
        >
          <View style={styles.reactionBar}>
            {REACTIONS.map((r) => (
              <TouchableOpacity
                key={r.type}
                style={styles.reactionBtn}
                onPress={() => {
                  onReact(r.type);
                  setShowReactions(false);
                }}
              >
                <Text style={styles.reactionEmoji}>{r.emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Menu Edit/Delete */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuBox}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                onEdit?.(post);
              }}
            >
              <Text>✏️ Chỉnh sửa</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                onDelete?.(post._id);
              }}
            >
              <Text style={{ color: "red" }}>🗑 Xóa</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    marginBottom: 10,
    paddingBottom: 10,
  },
  header: { flexDirection: "row", alignItems: "center", padding: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  username: { fontWeight: "bold", fontSize: 14 },
  time: { fontSize: 12, color: "#777" },
  content: { paddingHorizontal: 10, marginBottom: 10, fontSize: 15 },
  media: { width: "100%", height: 250 },
  meta: { paddingHorizontal: 10, color: "#555", fontSize: 13, marginTop: 5 },
  commentPreview: { paddingHorizontal: 10, marginTop: 5 },
  commentText: { fontSize: 13, marginBottom: 3 },
  commentAuthor: { fontWeight: "bold" },
  viewMore: { color: "#1877f2", fontSize: 13 },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderColor: "#eee",
    marginTop: 8,
    paddingTop: 5,
  },
  actionBtn: { flex: 1, alignItems: "center", paddingVertical: 8 },
  actionText: { fontWeight: "500", color: "#333" },

  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  reactionBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 10,
  },
  reactionBtn: { marginHorizontal: 5 },
  reactionEmoji: { fontSize: 28 },

  menuBox: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    width: 200,
  },
  menuItem: { paddingVertical: 10 },
});
