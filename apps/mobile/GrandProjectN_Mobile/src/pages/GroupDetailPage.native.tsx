import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as groupApi from '../services/group.api';
import * as postApi from '../services/post.api';
import { useAuth } from '../features/auth/AuthContext';
import CreatePost from '../features/feed/components/CreatePost';
import PostCard from '../features/feed/components/PostCard';
import Button from '../components/common/Button';
import type { Post, PostVisibility, ReactionType } from '../features/feed/types/Post';

interface Group {
  _id: string;
  name: string;
  description: string;
  owner: {
    _id: string;
    username: string;
  };
  avatar?: string;
  memberCount?: number;
}

const GroupDetailPage: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { id: groupId } = route.params as { id: string };
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);

  const { data: group, isLoading: isLoadingGroup, isError } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => groupApi.getGroupById(groupId),
    enabled: !!groupId,
  });

  const { data: joinStatusData } = useQuery({
    queryKey: ['group', groupId, 'joinStatus'],
    queryFn: () => groupApi.getGroupJoinStatus(groupId),
    enabled: !!groupId && !!user,
  });

  const { data: posts = [], isLoading: isLoadingPosts } = useQuery<Post[]>({
    queryKey: ['posts', 'group', groupId],
    queryFn: () => groupApi.getGroupPosts(groupId),
    enabled: !!groupId && joinStatusData?.status === 'MEMBER',
  });

  const joinStatus = joinStatusData?.status || 'NONE';
  const isOwner = !!(user && group && group.owner && user._id === group.owner._id);
  const isMember = joinStatus === 'MEMBER';

  const joinLeaveMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      if (!groupId) throw new Error('Missing groupId');
      if (isMember) {
        await groupApi.leaveGroup(groupId);
      } else {
        await groupApi.joinGroup(groupId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      queryClient.invalidateQueries({ queryKey: ['groups', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['group', groupId, 'joinStatus'] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'group', groupId] });
    },
  });

  const reactionMutation = useMutation({
    mutationFn: ({ postId, reaction }: { postId: string; reaction: ReactionType }) =>
      postApi.reactToPost(postId, reaction),
    onSuccess: (updatedPost: Post) => {
      queryClient.setQueryData(['posts', 'group', groupId], (oldData: Post[] | undefined) =>
        oldData?.map((p) => (p._id === updatedPost._id ? updatedPost : p)),
      );
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId: string) => postApi.deletePost(postId),
    onSuccess: (_: unknown, postId: string) => {
      queryClient.setQueryData(['posts', 'group', groupId], (oldData: Post[] | undefined) =>
        oldData?.filter((p) => p._id !== postId),
      );
    },
  });

  const handlePostCreated = (newPost: Post) => {
    queryClient.setQueryData(['posts', 'group', groupId], (oldData: Post[] | undefined) =>
      oldData ? [newPost, ...oldData] : [newPost],
    );
  };

  const handleReact = (postId: string, reaction: ReactionType) => {
    reactionMutation.mutate({ postId, reaction });
  };

  const handlePostDeleted = (postId: string) => {
    deletePostMutation.mutate(postId);
  };

  const handleCommentChange = (postId: string, change: 1 | -1) => {
    queryClient.setQueryData(['posts', 'group', groupId], (oldData: Post[] | undefined) =>
      oldData?.map((p) =>
        p._id === postId ? { ...p, commentCount: Math.max(0, (p.commentCount || 0) + change) } : p,
      ),
    );
  };

  const handlePostUpdated = (updated: Post) => {
    queryClient.setQueryData(['posts', 'group', groupId], (oldData: Post[] | undefined) =>
      oldData?.map((p) => (p._id === updated._id ? updated : p)),
    );
  };

  const renderGroupHeader = () => (
    <View style={styles.groupHeader}>
      {group?.avatar && (
        <Image source={{ uri: group.avatar }} style={styles.groupAvatar} />
      )}
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{group?.name}</Text>
        <Text style={styles.groupDescription}>{group?.description}</Text>
        <Text style={styles.memberCount}>{group?.memberCount} members</Text>
      </View>
      {!isOwner && (
        <Button
          onPress={() => joinLeaveMutation.mutate()}
          disabled={joinLeaveMutation.isPending}
          style={styles.joinButton}
        >
          {isMember ? 'Leave Group' : 'Join Group'}
        </Button>
      )}
    </View>
  );

  const renderPostItem = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      onReact={handleReact}
      onPostDeleted={handlePostDeleted}
      onCommentAdded={(id?: string) => handleCommentChange(id ?? item._id, 1)}
      onCommentDeleted={(id?: string) => handleCommentChange(id ?? item._id, -1)}
      onPostUpdated={handlePostUpdated} onRepost={function (postId: string, content: string, visibility: PostVisibility): void {
        throw new Error('Function not implemented.');
      } }    />
  );

  if (isLoadingGroup) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#4a7cff" />
          <Text style={styles.loadingText}>Đang tải nhóm...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !group) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Không tìm thấy nhóm hoặc đã có lỗi xảy ra.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <FlatList
        ListHeaderComponent={
          <>
            {renderGroupHeader()}
            {isMember ? (
              <>
               <CreatePost
  context="group"
  contextId={group._id}
  onPostCreated={handlePostCreated}
/>

                {isLoadingPosts && (
                  <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color="#4a7cff" />
                    <Text style={styles.loadingText}>Đang tải bài viết...</Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.nonMemberView}>
                <Text style={styles.nonMemberText}>Bạn phải là thành viên để xem và đăng bài.</Text>
                {!isOwner && joinStatus !== 'PENDING' && (
                  <Button
                    onPress={() => joinLeaveMutation.mutate()}
                    disabled={joinLeaveMutation.isPending}
                    style={styles.joinButton}
                  >
                    Tham gia nhóm
                  </Button>
                )}
                {joinStatus === 'PENDING' && (
                  <Text style={styles.pendingText}>Yêu cầu tham gia của bạn đã được gửi đi.</Text>
                )}
              </View>
            )}
          </>
        }
        data={isMember ? posts : []}
        renderItem={renderPostItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
  isMember && !isLoadingPosts ? (
    <View style={styles.centerContent}>
      <Text style={styles.emptyText}>Chưa có bài viết nào trong nhóm.</Text>
    </View>
  ) : null
}
/>

      {isMember && (
        <TouchableOpacity
          style={styles.inviteButton}
          onPress={() => setInviteModalOpen(true)}
        >
          <Text style={styles.inviteButtonText}>Mời bạn bè</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e4420',
  },
  groupHeader: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#083b38',
    alignItems: 'center',
  },
  groupAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#c1cd78',
    marginBottom: 8,
  },
  groupDescription: {
    fontSize: 16,
    color: '#d5e4c3',
    marginBottom: 8,
  },
  memberCount: {
    fontSize: 14,
    color: '#d5e4c3',
  },
  joinButton: {
    marginLeft: 16,
  },
  createPost: {
    margin: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  nonMemberView: {
    padding: 32,
    backgroundColor: '#083b38',
    borderRadius: 8,
    alignItems: 'center',
    margin: 16,
  },
  nonMemberText: {
    color: '#d5e4c3',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  pendingText: {
    color: '#d5e4c3',
    fontSize: 14,
    textAlign: 'center',
  },
  centerContent: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#d5e4c3',
    fontSize: 16,
    marginTop: 16,
  },
  errorText: {
    color: '#dc3545',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyText: {
    color: '#d5e4c3',
    fontSize: 16,
    textAlign: 'center',
  },
  inviteButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#4a7cff',
    padding: 16,
    borderRadius: 8,
  },
  inviteButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default GroupDetailPage;