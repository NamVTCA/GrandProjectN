import React from 'react';
import { Image, ImageStyle } from 'react-native';

const STATIC = process.env.VITE_API_STATIC_URL || 'http://localhost:8888';
const toAssetUrl = (u?: string): string =>
  !u ? '' : u.startsWith('http') ? u : `${STATIC}${u}`;

interface UserAvatarProps {
  src?: string;
  size?: number;
  style?: ImageStyle;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ src, size = 36, style }) => {
  const url = src ? toAssetUrl(src) : '';

  const imageStyle: ImageStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    resizeMode: 'cover',
  };

  return (
    <Image
      source={
        url
          ? { uri: url }
          : require('../../assets/images/placeholder-avatar.png')
      }
      style={[imageStyle, style]}
    />
  );
};

export default UserAvatar;
