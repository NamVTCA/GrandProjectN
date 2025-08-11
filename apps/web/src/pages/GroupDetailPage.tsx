import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as groupApi from '../services/group.api';
import * as postApi from '../services/post.api'; // Giả sử bạn có service này
import { useAuth } from '../features/auth/AuthContext';
import GroupHeader from '../features/groups/components/GroupHeader';
import CreatePost from '../features/feed/components/CreatePost';
import PostCard from '../features/feed/components/PostCard';
import Button from '../components/common/Button';
import './GroupDetailPage.scss';
import type { Post, ReactionType } from '../features/feed/types/Post';

const GroupDetailPage: React.FC = () => {
  const { id: groupId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);

  // --- QUERIES ---
  const { data: group, isLoading, isError } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => groupApi.getGroupById(groupId!),
    enabled: !!groupId, // Chỉ chạy query khi groupId tồn tại
  });

  const { data: joinStatusData } = useQuery({
    queryKey: ['group', groupId, 'joinStatus'],
    queryFn: () => groupApi.getGroupJoinStatus(groupId!),
    enabled: !!groupId && !!user,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['posts', 'group', groupId],
    queryFn: () => postApi.getPostsByGroup(groupId!),
    enabled: !!groupId && joinStatusData?.status === 'MEMBER',
  });

  const joinStatus = joinStatusData?.status || 'NONE';
  const isOwner = user?._id === group?.owner._id;
  const isMember = joinStatus === 'MEMBER';

  // --- MUTATIONS ---
  const joinLeaveMutation = useMutation<unknown, Error>({
    mutationFn: () => (isMember ? groupApi.leaveGroup(groupId!) : groupApi.joinGroup(groupId!)),
    onSuccess: () => {
      // Tải lại tất cả dữ liệu liên quan để UI được cập nhật
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      queryClient.invalidateQueries({ queryKey: ['groups', 'me'] });
    },
  });

  const reactionMutation = useMutation({
    mutationFn: ({ postId, reaction }: { postId: string; reaction: ReactionType }) =>
      postApi.reactToPost(postId, reaction),
    onSuccess: (updatedPost) => {
      queryClient.setQueryData(['posts', 'group', groupId], (oldData: Post[] | undefined) =>
        oldData?.map(p => p._id === updatedPost._id ? updatedPost : p)
      );
    }
  });

  const deletePostMutation = useMutation({
      mutationFn: (postId: string) => postApi.deletePost(postId),
      onSuccess: (_, postId) => {
          queryClient.setQueryData(['posts', 'group', groupId], (oldData: Post[] | undefined) =>
            oldData?.filter(p => p._id !== postId)
          );
      }
  });

  // --- HANDLERS ---
  const handlePostCreated = (newPost: Post) => {
      queryClient.setQueryData(['posts', 'group', groupId], (oldData: Post[] | undefined) => 
        oldData ? [newPost, ...oldData] : [newPost]
      );
  };

  const handleReact = (postId: string, reaction: ReactionType) => {
      reactionMutation.mutate({ postId, reaction });
  };
  
  const handlePostDeleted = (postId: string) => {
      deletePostMutation.mutate(postId);
  };

  if (isLoading) return <p className="page-status">Đang tải nhóm...</p>;
  if (isError || !group) return <p className="page-status">Không tìm thấy nhóm.</p>;

  return (
    <div className="group-detail-page">
      <GroupHeader
        group={group}
        isOwner={isOwner}
        isMember={isMember}
        joinStatus={joinStatus}
        isProcessing={joinLeaveMutation.isPending}
        onJoinLeaveClick={() => joinLeaveMutation.mutate()}
      />
      <div className="group-content-layout">
        <div className="main-content">
          {isMember ? (
            <>
              <CreatePost context="group" contextId={group._id} onPostCreated={handlePostCreated} />
              <div className="post-list">
                {posts.map(post => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onReact={handleReact}
                    onPostDeleted={handlePostDeleted}
                    onCommentAdded={() => queryClient.invalidateQueries({ queryKey: ['posts', 'group', groupId]})}
                    onCommentDeleted={() => queryClient.invalidateQueries({ queryKey: ['posts', 'group', groupId]})}
                    onRepost={() => {}}
                  />
                ))}
              </div>
            </>
          ) : (
             <div className="non-member-view">
              <h2>Bạn phải là thành viên để xem và đăng bài.</h2>
            </div>
          )}
        </div>
        <div className="sidebar-content">
          <h3>Giới thiệu</h3>
          <p>{group.description}</p>
          {isMember && (
            <Button variant="secondary" onClick={() => setInviteModalOpen(true)}>
              Mời bạn bè
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupDetailPage;
