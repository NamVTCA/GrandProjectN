import api from './api';
import type { Interest } from '../features/groups/types/Group'; // Tái sử dụng type Interest

/**
 * Lấy danh sách tất cả các sở thích có sẵn từ server.
 */
export const getInterests = (): Promise<Interest[]> =>
  api.get('/interests').then((res) => res.data);
