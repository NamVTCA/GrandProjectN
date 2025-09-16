import Config from 'react-native-config';

export const STATIC_ORIGIN =
  Config.API_STATIC_URL || 'http://localhost:8888';

export const toAssetUrl = (u?: string) =>
  !u ? '' : (u.startsWith('http') ? u : `${STATIC_ORIGIN}${u}`);
