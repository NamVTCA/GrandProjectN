export const STATIC_ORIGIN =
  import.meta.env.VITE_API_STATIC_URL || 'http://localhost:8888';

export const toAssetUrl = (u?: string) =>
  !u ? '' : (u.startsWith('http') ? u : `${STATIC_ORIGIN}${u}`);
