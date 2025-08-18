import api from './api';

const unwrap = (res: any) => res?.data ?? res;
const pickRoom = (x: any) => x?.room ?? x?.data?.room ?? x;

// ---- Rooms ----
export async function listRooms() {
  try { return unwrap(await api.get('/chat/rooms')); } catch {}
  try { return unwrap(await api.get('/rooms')); } catch {}
  throw new Error('listRooms: no compatible endpoint');
}

export async function getRoom(roomId: string) {
  try { return unwrap(await api.get(`/chat/rooms/${roomId}`)); } catch {}
  try { return unwrap(await api.get(`/chat/room/${roomId}`)); } catch {}
  try { return unwrap(await api.get(`/rooms/${roomId}`)); } catch {}
  throw new Error('getRoom: no compatible endpoint');
}

export async function getMessages(roomId: string) {
  try { return unwrap(await api.get(`/chat/rooms/${roomId}/messages`)); } catch {}
  try { return unwrap(await api.get(`/chat/room/${roomId}/messages`)); } catch {}
  try { return unwrap(await api.get(`/rooms/${roomId}/messages`)); } catch {}
  throw new Error('getMessages: no compatible endpoint');
}

// ---- Create DM/Group ----
export async function createDM(userId: string) {
  const payload = { memberIds: [userId] };
  try { return pickRoom(unwrap(await api.post('/chat/rooms', payload))); } catch {}
  try { return pickRoom(unwrap(await api.post('/chat/dm', { userId })) ); } catch {}
  throw new Error('createDM: no compatible endpoint');
}

export async function createGroup(name: string | undefined, memberIds: string[], avatarFile?: File | null) {
  if (memberIds.length === 1 && !avatarFile) return createDM(memberIds[0]);

  // with avatar
  if (avatarFile) {
    const form = new FormData();
    if (name) form.append('name', name);
    memberIds.forEach(id => form.append('memberIds', id));
    form.append('avatar', avatarFile);
    try { return pickRoom(unwrap(await api.post('/chat/rooms', form))); } catch {}
    try { return pickRoom(unwrap(await api.post('/rooms', form))); } catch {}
    throw new Error('createGroup(with avatar): no compatible endpoint');
  }

  // without avatar
  try { return pickRoom(unwrap(await api.post('/chat/rooms', { name, memberIds }))); } catch {}
  try { return pickRoom(unwrap(await api.post('/rooms', { name, memberIds }))); } catch {}
  throw new Error('createGroup: no compatible endpoint');
}

// ---- Members mgmt ----
export async function addRoomMembers(roomId: string, memberIds: string[]) {
  try { return unwrap(await api.post(`/chat/rooms/${roomId}/members`, { memberIds })); } catch {}
  try { return unwrap(await api.post(`/chat/rooms/${roomId}/add-members`, { memberIds })); } catch {}
  try { return unwrap(await api.post(`/rooms/${roomId}/members`, { memberIds })); } catch {}
  throw new Error('addRoomMembers: no compatible endpoint');
}

export async function kickRoomMember(roomId: string, userId: string) {
  try { return unwrap(await api.delete(`/chat/rooms/${roomId}/members/${userId}`)); } catch {}
  try { return unwrap(await api.post(`/chat/rooms/${roomId}/kick`, { userId })); } catch {}
  try { return unwrap(await api.delete(`/rooms/${roomId}/members/${userId}`)); } catch {}
  throw new Error('kickRoomMember: no compatible endpoint');
}

// ---- Room avatar ----
export async function uploadRoomAvatar(roomId: string, file: File) {
  const form = new FormData();
  form.append('avatar', file);
  try { return unwrap(await api.post(`/chat/rooms/${roomId}/avatar`, form)); } catch {}
  try { return unwrap(await api.post(`/chat/rooms/${roomId}/upload-avatar`, form)); } catch {}
  try { return unwrap(await api.post(`/rooms/${roomId}/avatar`, form)); } catch {}
  throw new Error('uploadRoomAvatar: no compatible endpoint');
}

// ---- Leave room ----
export async function leaveRoom(roomId: string, meId?: string) {
  try { return unwrap(await api.delete(`/chat/rooms/${roomId}/members/me`)); } catch {}
  try { return unwrap(await api.post(`/chat/rooms/${roomId}/leave`, {})); } catch {}
  if (meId) {
    try { return unwrap(await api.delete(`/chat/rooms/${roomId}/members/${meId}`)); } catch {}
    try { return unwrap(await api.delete(`/rooms/${roomId}/members/${meId}`)); } catch {}
  }
  throw new Error('leaveRoom: no compatible endpoint');
}
