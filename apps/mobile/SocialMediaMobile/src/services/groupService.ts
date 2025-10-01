import API_URL from "../config/api";

// 🟢 Lấy nhóm của user
// 🟢 Lấy nhóm của user (fix FE để khớp BE)
export async function getMyGroups(token: string) {
  const res = await fetch(`${API_URL}/groups/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}


// 🟢 Tạo nhóm
export async function createGroup(
  body: { 
    name: string; 
    description?: string; 
    interestIds?: string[]; 
    visibility?: "PUBLIC" | "PRIVATE"; 
  }, 
  token: string
) {
  const res = await fetch(`${API_URL}/groups`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// 🟢 Lấy chi tiết group
export async function getGroupById(groupId: string, token: string) {
  const res = await fetch(`${API_URL}/groups/${groupId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// 🟢 Lấy bài viết trong group
export async function getGroupPosts(groupId: string, token: string) {
  const res = await fetch(`${API_URL}/groups/${groupId}/posts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// 🟢 Join / Leave group
export async function joinGroup(groupId: string, token: string) {
  const res = await fetch(`${API_URL}/groups/${groupId}/join`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function leaveGroup(groupId: string, token: string) {
  const res = await fetch(`${API_URL}/groups/${groupId}/leave`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// 🟢 Lời mời nhóm
export async function getInvites(token: string) {
  const res = await fetch(`${API_URL}/groups/invites`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function sendInvite(groupId: string, userIds: string[], token: string) {
  const res = await fetch(`${API_URL}/groups/${groupId}/invites`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userIds }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// 🟢 Join requests
export async function getRequests(groupId: string, token: string) {
  const res = await fetch(`${API_URL}/groups/${groupId}/requests`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function approveRequest(groupId: string, requestId: string, token: string) {
  const res = await fetch(`${API_URL}/groups/${groupId}/requests/${requestId}/approve`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function rejectRequest(groupId: string, requestId: string, token: string) {
  const res = await fetch(`${API_URL}/groups/${groupId}/requests/${requestId}/reject`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// 🟢 Update group
export async function updateGroup(
  groupId: string, 
  body: { 
    name?: string; 
    description?: string; 
    interestIds?: string[]; 
    visibility?: "PUBLIC" | "PRIVATE"; 
  }, 
  token: string
) {
  const res = await fetch(`${API_URL}/groups/${groupId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// 🟢 Quản lý members
export async function getGroupMembers(groupId: string, token: string) {
  const res = await fetch(`${API_URL}/groups/${groupId}/members`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function removeMember(groupId: string, memberId: string, token: string) {
  const res = await fetch(`${API_URL}/groups/${groupId}/members/${memberId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
