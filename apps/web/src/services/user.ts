import api from './api';

const unwrap = (res: any) => res?.data ?? res;

export async function getBlockStatus(targetId: string): Promise<{ blockedByMe: boolean; blockedMe: boolean }> {
  try { return unwrap(await api.get(`/users/${targetId}/block-status`)); } catch {}
  try { return unwrap(await api.get(`/block/status`, { params: { userId: targetId } })); } catch {}
  try { return unwrap(await api.get(`/users/block-status?userId=${encodeURIComponent(targetId)}`)); } catch {}
  // fallback an toàn
  return { blockedByMe: false, blockedMe: false };
}

export async function blockUser(targetId: string) {
  try { return unwrap(await api.post(`/users/${targetId}/block`, {})); } catch {}
  try { return unwrap(await api.post(`/block`, { userId: targetId })); } catch {}
  try { return unwrap(await api.post(`/users/block`, { userId: targetId })); } catch {}
  throw new Error('blockUser: no compatible endpoint');
}

export async function unblockUser(targetId: string) {
  try { return unwrap(await api.post(`/users/${targetId}/unblock`, {})); } catch {}
  try { return unwrap(await api.post(`/unblock`, { userId: targetId })); } catch {}
  try { return unwrap(await api.post(`/users/unblock`, { userId: targetId })); } catch {}
  throw new Error('unblockUser: no compatible endpoint');
}
