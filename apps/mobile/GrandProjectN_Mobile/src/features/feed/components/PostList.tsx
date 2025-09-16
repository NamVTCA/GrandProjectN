import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../auth/AuthContext';
import api from '../../../services/api';
import type { Post, ReactionType } from '../types/Post';
import PostCard from './PostCard';
import CreatePost from './CreatePost';

interface PostListProps {
  context?: 'profile' | 'group' | 'feed';
  contextId?: string;
  showCreatePost?: boolean;
  onPostCountChange?: (count: number) => void;
}

const PostList: React.FC<PostListProps> = ({
  context = 'feed',
  contextId,
  showCreatePost = true,
  onPostCountChange,
}) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(
    async (pageNum = 1, isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else if (pageNum === 1) {
          setLoading(true);
        }

        let endpoint = '/posts';
        const params: any = { page: pageNum, limit: 10 };

        if (context === 'profile' && contextId) {
          endpoint = `/users/${contextId}/posts`;
        } else if (context === 'group' && contextId) {
          endpoint = `/groups/${contextId}/posts`;
        }

        const response = await api.get(endpoint, { params });
        const newPosts = response.data.posts || response.data;

        if (isRefresh || pageNum === 1) {
          setPosts(newPosts);
        } else {
          setPosts((prev) => [...prev, ...newPosts]);
        }

        setHasMore(newPosts.length === 10);
        setError(null);

        if (onPostCountChange) {
          onPostCountChange(response.data.totalCount ?? newPosts.length);
        }
      } catch (err: any) {
        console.error('Lỗi khi tải bài viết:', err);
        setError(err.response?.data?.message || 'Không thể tải bài viết');

        if (pageNum === 1) {
          setPosts([]);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [context, contextId, onPostCountChange]
  );

  useEffect(() => {
    fetchPosts(1, false);
  }, [fetchPosts]);

  const handleRefresh = () => {
    setPage(1);
    fetchPosts(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage, false);
    }
  };

  const handlePostCreated = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
    if (onPostCountChange) {
      onPostCountChange(posts.length + 1);
    }
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((post) => post._id !== postId));
    if (onPostCountChange) {
      onPostCountChange(Math.max(0, posts.length - 1));
    }
  };

  const handlePostUpdated = (updatedPost: Post) => {
    setPosts((prev) =>
      prev.map((post) => (post._id === updatedPost._id ? updatedPost : post))
    );
  };

  const handleReact = async (postId: string, reaction: ReactionType) => {
    try {
      const response = await api.post(`/posts/${postId}/react`, { reaction });
      const updatedPost = response.data;

      setPosts((prev) =>
        prev.map((post) => (post._id === postId ? updatedPost : post))
      );
    } catch (error) {
      console.error('Lỗi khi thực hiện reaction:', error);
      Alert.alert('Lỗi', 'Không thể thực hiện reaction');
    }
  };

  const handleRepost = async (
    postId: string,
    content: string,
    visibility: any
  ) => {
    try {
      const response = await api.post(`/posts/${postId}/repost`, {
        content,
        visibility,
      });
      const newRepost = response.data;

      setPosts((prev) => [newRepost, ...prev]);
      if (onPostCountChange) {
        onPostCountChange(posts.length + 1);
      }
    } catch (error: any) {
      console.error('Lỗi khi chia sẻ bài viết:', error);
      Alert.alert(
        'Lỗi',
        error.response?.data?.message || 'Không thể chia sẻ bài viết'
      );
    }
  };

  const handleCommentAdded = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post._id === postId
          ? { ...post, commentCount: (post.commentCount || 0) + 1 }
          : post
      )
    );
  };

  const handleCommentDeleted = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post._id === postId
          ? {
              ...post,
              commentCount: Math.max(0, (post.commentCount || 0) - 1),
            }
          : post
      )
    );
  };

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#c1cd78" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {context === 'profile'
            ? 'Chưa có bài viết nào.'
            : context === 'group'
            ? 'Nhóm chưa có bài viết nào.'
            : 'Chưa có bài viết nào trong bảng feed.'}
        </Text>
        {context === 'profile' && user?._id === contextId && (
          <Text style={styles.emptySubtext}>
            Hãy tạo bài viết đầu tiên của bạn!
          </Text>
        )}
      </View>
    );
  };

  const renderError = () => {
    if (!error) return null;

    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading && page === 1) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#c1cd78" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showCreatePost && (
        <CreatePost
          onPostCreated={handlePostCreated}
          context={context === 'feed' ? undefined : context}
          contextId={contextId}
        />
      )}

      {renderError()}

      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onReact={handleReact}
            onRepost={handleRepost}
            onPostDeleted={handlePostDeleted}
            onCommentAdded={handleCommentAdded}
            onCommentDeleted={handleCommentDeleted}
            onPostUpdated={handlePostUpdated}
          />
        )}
        ListEmptyComponent={renderEmpty()}
        ListFooterComponent={renderFooter()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#c1cd78']}
            tintColor={'#c1cd78'}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLoader: {
    padding: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#a3b18a',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#a3b18a',
    fontSize: 14,
    textAlign: 'center',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#c1cd78',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#0e4420',
    fontWeight: 'bold',
  },
});

export default PostList;
