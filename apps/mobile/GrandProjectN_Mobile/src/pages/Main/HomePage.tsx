import React from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import apiClient from '../../api/apiClient';
import { Post } from '../../types';
import PostCard from '../../components/posts/PostCard';
import { colors, spacing, typography } from '../../styles/theme';

const HomePage = () => {
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/posts/feed');
      setPosts(response.data);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchPosts();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={({ item }) => <PostCard post={item} />}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: spacing.medium }}
        ListHeaderComponent={<Text style={styles.headerTitle}>Bảng tin</Text>}
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>Chưa có bài viết nào.</Text>
          </View>
        }
        onRefresh={fetchPosts}
        refreshing={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.large },
    headerTitle: { ...typography.h1, color: colors.primary, marginBottom: spacing.medium },
    emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
});

export default HomePage;