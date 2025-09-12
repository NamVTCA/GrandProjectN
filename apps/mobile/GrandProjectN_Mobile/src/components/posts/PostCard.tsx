import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '../../types';
import { colors, spacing, typography } from '../../styles/theme';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { vi } from 'date-fns/locale/vi';

interface PostCardProps {
  post: Post;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const authorName = post.author?.displayName || 'Người dùng ẩn danh';
  const authorAvatar = post.author?.avatar || 'https://via.placeholder.com/150';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Image source={{ uri: authorAvatar }} style={styles.avatar} />
        <View>
          <Text style={styles.authorName}>{authorName}</Text>
          <Text style={styles.timestamp}>
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: vi })}
          </Text>
        </View>
      </View>
      <Text style={styles.content}>{post.content}</Text>
      {post.media?.[0] && (
        <Image source={{ uri: post.media[0] }} style={styles.mediaImage} />
      )}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="heart-outline" size={24} color={colors.textSecondary} />
          <Text style={styles.actionText}>Thích</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={24} color={colors.textSecondary} />
          <Text style={styles.actionText}>Bình luận</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-social-outline" size={24} color={colors.textSecondary} />
          <Text style={styles.actionText}>Chia sẻ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
    card: { backgroundColor: colors.card, borderRadius: spacing.medium, padding: spacing.medium, marginBottom: spacing.medium },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.small },
    avatar: { width: 45, height: 45, borderRadius: 22.5, marginRight: spacing.small, backgroundColor: colors.background },
    authorName: { ...typography.body, fontWeight: 'bold' },
    timestamp: { fontSize: 12, color: colors.textSecondary },
    content: { ...typography.body, marginVertical: spacing.medium },
    mediaImage: { width: '100%', height: 250, borderRadius: spacing.small, marginTop: spacing.small, backgroundColor: colors.background },
    actions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.medium, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.medium },
    actionButton: { flexDirection: 'row', alignItems: 'center' },
    actionText: { color: colors.textSecondary, marginLeft: spacing.small },
});

export default PostCard;