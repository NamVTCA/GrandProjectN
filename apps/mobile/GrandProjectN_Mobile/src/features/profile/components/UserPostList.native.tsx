import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import api from '../../../services/api';
import PostCard from '../../feed/components/PostCard';
import type { Post } from '../../feed/types/Post';

interface UserPostListProps {
  userId: string;
}

const UserPostList: React.FC<UserPostListProps> = ({ userId }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserPosts = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await api.get(`/posts/user/${userId}`);
      setPosts(response.data);
    } catch (error) {
      console.error("Lỗi khi tải bài đăng của người dùng:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserPosts();
  }, [fetchUserPosts]);

  if (loading) return <Text style={styles.loading}>Đang tải bài đăng...</Text>;
  if (posts.length === 0) return <Text style={styles.empty}>Người dùng này chưa có bài đăng nào.</Text>;

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <PostCard 
          post={item}
          onReact={() => { } }
          onRepost={() => { } }
          onPostDeleted={(postId: string) => {
            setPosts(prev => prev.filter(p => p._id !== postId));
          } }
          onCommentAdded={() => { } }
          onCommentDeleted={() => { } } onPostUpdated={function (updatedPost: Post): void {
            throw new Error('Function not implemented.');
          } }        />
      )}
      numColumns={1}
      contentContainerStyle={styles.container}
      columnWrapperStyle={styles.columnWrapper}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  loading: {
    textAlign: 'center',
    color: '#999',
    margin: 20,
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    margin: 20,
  },
});

export default UserPostList;