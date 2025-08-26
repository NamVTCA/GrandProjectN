// File: src/services/user.ts
import api from './api';

export type BlockStatus = { blockedByMe: boolean; blockedMe: boolean };

const unwrap = (res: any) => res?.data ?? res;
const normalizeStatus = (x: any): BlockStatus => ({
  blockedByMe: !!(x?.blockedByMe),
  blockedMe: !!(x?.blockedMe),
});

/** Lấy trạng thái chặn giữa mình và target */
export async function getBlockStatus(targetId: string): Promise<BlockStatus> {
  try { return normalizeStatus(unwrap(await api.get(`/users/${targetId}/block-status`))); } catch {}
  try { return normalizeStatus(unwrap(await api.get(`/block/status`, { params: { userId: targetId } }))); } catch {}
  try { return normalizeStatus(unwrap(await api.get(`/users/block-status`, { params: { userId: targetId } }))); } catch {}
  // fallback an toàn
  return { blockedByMe: false, blockedMe: false };
}

/** Chặn người dùng */
export async function blockUser(targetId: string) {
  // chuẩn khuyến nghị
  try { return unwrap(await api.post(`/users/${targetId}/block`, {})); } catch {}
  // fallback các biến thể có thể gặp
  try { return unwrap(await api.post(`/block`, { userId: targetId })); } catch {}
  try { return unwrap(await api.post(`/users/block`, { userId: targetId })); } catch {}
  throw new Error('blockUser: no compatible endpoint');
}

/** Bỏ chặn người dùng */
export async function unblockUser(targetId: string) {
  // chuẩn khuyến nghị (DELETE)
  try { return unwrap(await api.delete(`/users/${targetId}/block`)); } catch {}
  // fallback các biến thể thường gặp
  try { return unwrap(await api.delete(`/block`, { params: { userId: targetId } })); } catch {}
  try { return unwrap(await api.post(`/users/${targetId}/unblock`, {})); } catch {}
  try { return unwrap(await api.post(`/unblock`, { userId: targetId })); } catch {}
  throw new Error('unblockUser: no compatible endpoint');
}
