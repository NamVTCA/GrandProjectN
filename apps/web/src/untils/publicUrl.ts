export function publicUrl(path: string) {
  if (!path) return '';
  // nếu đã đầy đủ, trả thẳng
  if (path.startsWith('http')) return path;
  // ngược lại, prepend host tĩnh
  return `${import.meta.env.VITE_API_STATIC_URL}${path}`;
}
