import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as groupApi from '../services/group.api';
import * as postApi from '../services/post.api';
import { useAuth } from '../features/auth/AuthContext';
import GroupHeader from '../features/groups/components/GroupHeader';
import InviteFriendsModal from '../features/groups/components/InviteFriendsModal';
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
  const { data: group, isLoading: isLoadingGroup, isError } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => groupApi.getGroupById(groupId!),
    enabled: !!groupId,
  });

  const { data: joinStatusData } = useQuery({
    queryKey: ['group', groupId, 'joinStatus'],
    queryFn: () => groupApi.getGroupJoinStatus(groupId!),
    enabled: !!groupId && !!user,
  });

  // Bài đăng trong nhóm (chỉ khi là thành viên)
  const { data: posts = [], isLoading: isLoadingPosts } = useQuery<Post[]>({
    queryKey: ['posts', 'group', groupId],
    queryFn: () => groupApi.getGroupPosts(groupId!),
    enabled: !!groupId && joinStatusData?.status === 'MEMBER',
  });

  const joinStatus = joinStatusData?.status || 'NONE';
  const isOwner = !!(user && group && (group as any).owner && user._id === (group as any).owner._id);
  const isMember = joinStatus === 'MEMBER';

  // --- MUTATIONS ---
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

  // --- HANDLERS ---
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

  if (isLoadingGroup) return <p className="page-status">Đang tải nhóm...</p>;
  if (isError || !group)
    return <p className="page-status">Không tìm thấy nhóm hoặc đã có lỗi xảy ra.</p>;

  return (
    <div className="group-detail-page">
      <GroupHeader
        group={group}
        isOwner={isOwner}
        isMember={isMember}
        joinStatus={joinStatus}
        isProcessing={joinLeaveMutation.isPending}
        onJoinLeaveClick={() => joinLeaveMutation.mutate()}
        onInviteFriends={() => setInviteModalOpen(true)}
      />

      <div className="group-content-layout">
        <div className="main-content">
          {/* KHUNG GIỚI THIỆU (đặt TRÊN CreatePost) */}
          {Boolean((group as any).description) && (
            <section className="group-intro-card">
              <h3>Giới thiệu</h3>
              <p>{(group as any).description}</p>
            </section>
          )}

          {isMember ? (
            <>
              <CreatePost
                context="group"
                contextId={(group as any)._id}
                onPostCreated={handlePostCreated}
              />

              <div className="post-list">
                {isLoadingPosts && <p className="page-status">Đang tải bài viết...</p>}
                {!isLoadingPosts && posts.length === 0 && (
                  <p className="page-status">Chưa có bài viết nào trong nhóm.</p>
                )}

                {posts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onReact={handleReact}
                    onPostDeleted={handlePostDeleted}
                    onCommentAdded={(id?: string) => handleCommentChange(id ?? post._id, 1)}
                    onCommentDeleted={(id?: string) => handleCommentChange(id ?? post._id, -1)}
                    onRepost={(postId, content, visibility) => {
                      console.debug('repost', { postId, content, visibility });
                    }}
                    onPostUpdated={handlePostUpdated}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="non-member-view">
              <h2>Bạn phải là thành viên để xem và đăng bài.</h2>
              {!isOwner && joinStatus !== 'PENDING' && (
                <Button
                  onClick={() => joinLeaveMutation.mutate()}
                  disabled={joinLeaveMutation.isPending}
                >
                  Tham gia nhóm
                </Button>
              )}
              {joinStatus === 'PENDING' && <p>Yêu cầu tham gia của bạn đã được gửi đi.</p>}
            </div>
          )}
        </div>

        {/* Nếu không có widget nào ở sidebar, có thể xoá khối này hoàn toàn */}
        {/* <div className="sidebar-content"></div> */}
      </div>

      <InviteFriendsModal
        open={isInviteModalOpen}
        groupId={(group as any)._id}
        onClose={() => setInviteModalOpen(false)}
      />
    </div>
  );
};

export default GroupDetailPage;
