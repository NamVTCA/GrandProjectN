import api from './api'; // axios instance
import type {
  Group,
  GroupDetail,
  GroupMember,
  JoinRequest,
} from '../features/groups/types/Group';
import type { CreateGroupDto, UpdateGroupDto } from '../features/groups/types/GroupDto';
import type { Post } from '../features/feed/types/Post';

/** ====== TYPES (Invites) ====== */
export type InviteCandidate = {
  id: string;
  username?: string;
  fullName?: string;
  avatar?: string;
};

export type InviteBatchResult = {
  created: number;
  skipped: number;
  details: { inviteeId: string; status: 'CREATED'|'SKIPPED'; reason?: string }[];
};

export type MyInviteItem = {
  id: string;
  status: 'PENDING'|'ACCEPTED'|'DECLINED'|'CANCELED';
  inviter: { id: string; username?: string; fullName?: string; avatar?: string };
  group: { id: string; name?: string; avatar?: string };
  createdAt: string;
};

/** ====== QUERIES ====== */
export const getMyGroups = (): Promise<Group[]> =>
  api.get('/groups/me').then((res) => res.data);

export const getSuggestedGroups = (): Promise<Group[]> =>
  api.get('/groups/suggestions').then((res) => res.data);

export const getGroupById = (groupId: string): Promise<GroupDetail> =>
  api.get(`/groups/${groupId}`).then((res) => res.data);

export const getGroupMembers = (groupId: string): Promise<GroupMember[]> =>
  api.get(`/groups/${groupId}/members`).then((res) => res.data);

export const getGroupJoinRequests = (groupId: string): Promise<JoinRequest[]> =>
  api.get(`/groups/${groupId}/requests`).then((res) => res.data);

export const getGroupJoinStatus = (
  groupId: string,
): Promise<{ status: 'MEMBER' | 'PENDING' | 'NONE' }> =>
  api.get(`/groups/${groupId}/join-status`).then((res) => res.data);

/** ✅ Invite candidates (friends not in group & not already invited PENDING) */
export const getInviteCandidates = (
  groupId: string,
  search?: string,
): Promise<InviteCandidate[]> =>
  api.get(`/groups/${groupId}/invites/candidates`, { params: { search } }).then((r) => r.data);

/** ====== MUTATIONS ====== */
export const createGroup = (groupData: CreateGroupDto): Promise<Group> =>
  api.post('/groups', groupData).then((res) => res.data);

export const getGroupPosts = (groupId: string): Promise<Post[]> =>
  api.get(`/groups/${groupId}/posts`).then((res) => res.data);

export const updateGroup = ({
  groupId,
  groupData,
}: {
  groupId: string;
  groupData: UpdateGroupDto;
}): Promise<Group> =>
  api.patch(`/groups/${groupId}`, groupData).then((res) => res.data);

export const uploadGroupImage = async ({
  groupId,
  imageType,
  file,
}: {
  groupId: string;
  imageType: 'avatar' | 'cover';
  file: File;
}): Promise<Group> => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.patch(`/groups/${groupId}/${imageType}`, formData);
  return data;
};

export const deleteGroup = (groupId: string): Promise<{ message: string }> =>
  api.delete(`/groups/${groupId}`).then((res) => res.data);

export const joinGroup = (groupId: string): Promise<{ message: string }> =>
  api.post(`/groups/${groupId}/join`).then((res) => res.data);

export const leaveGroup = (groupId: string): Promise<GroupDetail> =>
  api.post(`/groups/${groupId}/leave`).then((res) => res.data);

/** (Legacy) invite single user */
export const inviteToGroup = ({
  groupId,
  inviteeId,
}: {
  groupId: string;
  inviteeId: string;
}) =>
  api.post(`/groups/${groupId}/invite`, { inviteeId }).then((res) => res.data);

/** ✅ batch invites */
export const sendGroupInvites = ({
  groupId,
  inviteeIds,
}: {
  groupId: string;
  inviteeIds: string[];
}): Promise<InviteBatchResult> =>
  api.post(`/groups/${groupId}/invites`, { inviteeIds }).then((r) => r.data);

export const kickMember = ({
  groupId,
  memberUserId,
}: {
  groupId: string;
  memberUserId: string;
}): Promise<{ message: string }> =>
  api.delete(`/groups/${groupId}/members/${memberUserId}`).then((res) => res.data);

export const approveJoinRequest = (
  groupId: string,
  requestId: string,
): Promise<{ message: string }> =>
  api.post(`/groups/${groupId}/requests/${requestId}/approve`).then((res) => res.data);

export const rejectJoinRequest = (
  groupId: string,
  requestId: string,
): Promise<{ message: string }> =>
  api.post(`/groups/${groupId}/requests/${requestId}/reject`).then((res) => res.data);

/** ====== INVITES (Me) ====== */
export const getMyGroupInvites = (
  status: 'PENDING'|'ACCEPTED'|'DECLINED'|'CANCELED' = 'PENDING',
): Promise<MyInviteItem[]> =>
  api.get('/group-invites/me', { params: { status } }).then((r) => r.data);

export const acceptGroupInvite = (inviteId: string): Promise<{ message: string }> =>
  api.post(`/group-invites/${inviteId}/accept`).then((r) => r.data);

export const declineGroupInvite = (inviteId: string): Promise<{ message: string }> =>
  api.post(`/group-invites/${inviteId}/decline`).then((r) => r.data);

