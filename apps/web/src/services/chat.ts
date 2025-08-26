// src/services/chat.ts
import api from './api';

const unwrap = (res: any) => res?.data ?? res;
const pickRoom = (x: any) => x?.room ?? x?.data?.room ?? x;
const uniqStr = (ids: (string | number)[]) => Array.from(new Set(ids.map((v) => String(v))));

const rethrow = (fallbackMsg: string) => (err: any) => {
  const msg = err?.response?.data?.message || err?.message || fallbackMsg;
  throw new Error(msg);
};

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
  const ids = uniqStr(memberIds);
  if (ids.length === 1 && !avatarFile) return createDM(ids[0]);

  // with avatar
  if (avatarFile) {
    const form = new FormData();
    if (name) form.append('name', name);
    ids.forEach(id => form.append('memberIds', id));
    form.append('avatar', avatarFile);
    try { return pickRoom(unwrap(await api.post('/chat/rooms', form, { headers: { 'Content-Type': 'multipart/form-data' } }))); } catch {}
    try { return pickRoom(unwrap(await api.post('/rooms', form, { headers: { 'Content-Type': 'multipart/form-data' } }))); } catch {}
    throw new Error('createGroup(with avatar): no compatible endpoint');
  }

  // without avatar
  try { return pickRoom(unwrap(await api.post('/chat/rooms', { name, memberIds: ids }))); } catch {}
  try { return pickRoom(unwrap(await api.post('/rooms', { name, memberIds: ids }))); } catch {}
  throw new Error('createGroup: no compatible endpoint');
}

// ---- Members ----
export async function addRoomMembers(roomId: string, memberIds: string[]) {
  const ids = uniqStr(memberIds);
  if (!ids.length) throw new Error('addRoomMembers: empty memberIds');

  try {
    const res = await api.post(`/chat/rooms/${roomId}/members`, { memberIds: ids });
    return res.data?.room ?? res.data;
  } catch (e) { /* fallthrough */ }

  try {
    const res = await api.post(`/rooms/${roomId}/members`, { memberIds: ids });
    return res.data?.room ?? res.data;
  } catch (e) {
    rethrow('addRoomMembers failed')(e);
  }
}

export async function kickRoomMember(roomId: string, userId: string) {
  try { return unwrap(await api.delete(`/chat/rooms/${roomId}/members/${userId}`)); }
  catch {} 
  try { return unwrap(await api.post(`/chat/rooms/${roomId}/kick`, { userId })); }
  catch {} 
  try { return unwrap(await api.delete(`/rooms/${roomId}/members/${userId}`)); }
  catch (e) { rethrow('kickRoomMember failed')(e); }
}

// ---- Room avatar ----
export async function uploadRoomAvatar(roomId: string, file: File) {
  const form = new FormData();
  form.append('avatar', file);
  try { return unwrap(await api.post(`/chat/rooms/${roomId}/avatar`, form, { headers: { 'Content-Type': 'multipart/form-data' } })); } catch {}
  try { return unwrap(await api.post(`/chat/rooms/${roomId}/upload-avatar`, form, { headers: { 'Content-Type': 'multipart/form-data' } })); } catch {}
  try { return unwrap(await api.post(`/rooms/${roomId}/avatar`, form, { headers: { 'Content-Type': 'multipart/form-data' } })); } catch (e) {
    rethrow('uploadRoomAvatar failed')(e);
  }
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
