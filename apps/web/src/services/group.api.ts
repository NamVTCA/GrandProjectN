import api from './api'; // Import instance axios đã được cấu hình sẵn của bạn
import type {
  Group,
  GroupDetail,
  GroupMember,
  JoinRequest,
} from '../features/groups/types/Group';
import type { CreateGroupDto, UpdateGroupDto } from '../features/groups/types/GroupDto';
import type { Post } from '../features/feed/types/Post'; // Import kiểu dữ liệu Post

// === QUERIES (LẤY DỮ LIỆU) ===

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

// === MUTATIONS (THAY ĐỔI DỮ LIỆU) ===

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

// ✅ BỔ SUNG: HÀM UPLOAD ẢNH
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

  const { data } = await api.patch(`/groups/${groupId}/${imageType}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

export const deleteGroup = (groupId: string): Promise<{ message: string }> =>
  api.delete(`/groups/${groupId}`).then((res) => res.data);

export const joinGroup = (groupId: string): Promise<{ message: string }> =>
  api.post(`/groups/${groupId}/join`).then((res) => res.data);

export const leaveGroup = (groupId: string): Promise<GroupDetail> =>
  api.post(`/groups/${groupId}/leave`).then((res) => res.data);

export const inviteToGroup = ({
  groupId,
  inviteeId,
}: {
  groupId: string;
  inviteeId: string;
}): Promise<any> =>
  api.post(`/groups/${groupId}/invite`, { inviteeId }).then((res) => res.data);

export const kickMember = ({
  groupId,
  memberUserId,
}: {
  groupId: string;
  memberUserId: string;
}): Promise<{ message: string }> =>
  api
    .delete(`/groups/${groupId}/members/${memberUserId}`)
    .then((res) => res.data);

export const approveJoinRequest = (
  groupId: string,
  requestId: string,
): Promise<{ message: string }> =>
  api
    .post(`/groups/${groupId}/requests/${requestId}/approve`)
    .then((res) => res.data);

export const rejectJoinRequest = (
  groupId: string,
  requestId: string,
): Promise<{ message: string }> =>
  api
    .post(`/groups/${groupId}/requests/${requestId}/reject`)
    .then((res) => res.data);
