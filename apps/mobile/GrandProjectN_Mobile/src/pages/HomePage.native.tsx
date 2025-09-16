import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../services/api';
import CreatePost from '../features/feed/components/CreatePost';
import PostCard from '../features/feed/components/PostCard';
import type { Post, ReactionType, PostVisibility } from '../features/feed/types/Post';
import { useAuth } from '../features/auth/AuthContext';
import ChatbotIcon from './ChatbotIcon.native';

const HomePage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/posts/feed');
      if (Array.isArray(response.data)) {
        setPosts(response.data);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error("Lỗi khi tải bài đăng:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePostCreated = (newPost: Post) => {
    setPosts(currentPosts => [newPost, ...currentPosts]);
  };

  const handlePostUpdated = (updatedPost: Post) => {
    setPosts(currentPosts =>
      currentPosts.map(p => (p._id === updatedPost._id ? updatedPost : p))
    );
  };

  const handleReact = useCallback(async (postId: string, reactionType: ReactionType) => {
    try {
      const response = await api.post(`/posts/${postId}/react`, { type: reactionType });
      setPosts(currentPosts =>
        currentPosts.map(p => (p._id === postId ? response.data : p))
      );
    } catch (error) {
      console.error("Lỗi khi bày tỏ cảm xúc:", error);
    }
  }, []);

  const handleRepost = useCallback(async (postId: string, content: string, visibility: PostVisibility) => {
    try {
      const response = await api.post(`/posts/${postId}/repost`, { content, visibility });
      handlePostCreated(response.data);
    } catch (error) {
      console.error("Lỗi khi chia sẻ bài viết:", error);
    }
  }, []);
  
  const handlePostDeleted = useCallback(async (postId: string) => {
    try {
      await api.delete(`/posts/${postId}`);
      setPosts(currentPosts => currentPosts.filter(p => p._id !== postId));
    } catch (error) {
      console.error("Lỗi khi xóa bài viết:", error);
    }
  }, []);

  const handleCommentUpdated = useCallback(async (postId: string) => {
    try {
      const response = await api.get(`/posts/${postId}`);
      setPosts(currentPosts => currentPosts.map(p => 
        p._id === postId ? response.data : p
      ));
    } catch (error) {
      console.error("Lỗi khi cập nhật số bình luận:", error);
    }
  }, []);

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#3a7ca5" />
      <Text style={styles.loadingText}>Đang tải bài đăng...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <CreatePost onPostCreated={handlePostCreated} />
      <ScrollView style={styles.feedContainer}>
        {posts.length > 0 ? (
          posts.map((post) => (
            <PostCard 
              key={post._id}
              post={post}
              onReact={handleReact}
              onRepost={handleRepost}
              onPostDeleted={handlePostDeleted}
              onCommentAdded={handleCommentUpdated} 
              onCommentDeleted={handleCommentUpdated}
              onPostUpdated={handlePostUpdated}
            />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Bảng tin của bạn chưa có gì. Hãy kết bạn để xem thêm nhé!
            </Text>
          </View>
        )}
      </ScrollView>
      <ChatbotIcon />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#008c75',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#008c75',
  },
  loadingText: {
    marginTop: 10,
    color: '#6236c9',
    fontSize: 16,
  },
  feedContainer: {
    marginTop: 20,
  },
  emptyContainer: {
    padding: 20,
    backgroundColor: '#42a0e8',
    borderRadius: 8,
    marginTop: 50,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6236c9',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default HomePage;
