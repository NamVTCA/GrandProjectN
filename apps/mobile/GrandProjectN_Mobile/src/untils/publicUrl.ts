import Config from 'react-native-config';

export const STATIC_ORIGIN =
  Config.API_STATIC_URL || 'http://localhost:8888';

export const toAssetUrl = (u?: string) =>
  !u ? '' : (u.startsWith('http') ? u : `${STATIC_ORIGIN}${u}`);

/**
 * Chuyển đổi một đường dẫn tài nguyên tương đối từ API thành một URL đầy đủ.
 * @param path Đường dẫn tương đối từ API
 * @returns URL đầy đủ có thể truy cập được
 */
export function publicUrl(path?: string): string {
  if (!path) return '';

  // Nếu đã là một URL đầy đủ, trả về ngay lập tức
  if (path.startsWith('http')) return path;

  // Lấy URL gốc và đảm bảo nó không có dấu / ở cuối
  const staticUrl = (STATIC_ORIGIN || '').replace(/\/$/, '');

  // Đảm bảo đường dẫn tương đối có dấu / ở đầu
  const formattedPath = path.startsWith('/') ? path : `/${path}`;

  return `${staticUrl}${formattedPath}`;
}
