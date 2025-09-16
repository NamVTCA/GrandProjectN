import React from 'react';
import { View, Image, ImageSourcePropType, StyleSheet } from 'react-native';

const STATIC = process.env.VITE_API_STATIC_URL || 'http://localhost:8888';
const toAssetUrl = (u?: string): string => (!u ? '' : u.startsWith('http') ? u : `${STATIC}${u}`);

type Props = {
  avatarUrl: string;
  frameAssetUrl?: string;
  size?: number;
  frameScale?: number;
  offsetX?: number;
  offsetY?: number;
  rounded?: boolean;
  style?: any;
  frameFit?: 'contain' | 'cover';
};

const AvatarWithFrame: React.FC<Props> = ({
  avatarUrl,
  frameAssetUrl,
  size = 96,
  frameScale = 1.35,
  offsetX = 0,
  offsetY = 0,
  rounded = true,
  style,
  frameFit = 'contain',
}) => {
  const frameSrc = frameAssetUrl ? toAssetUrl(frameAssetUrl) : undefined;

  const styles = StyleSheet.create({
    container: {
      position: 'relative',
      width: size,
      height: size,
    },
    avatar: {
      width: '100%',
      height: '100%',
      borderRadius: rounded ? size / 2 : 8,
      resizeMode: 'cover',
      position: 'relative',
      zIndex: 1,
    },
    frame: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      resizeMode: frameFit,
      transform: [{ translateX: offsetX }, { translateY: offsetY }, { scale: frameScale }],
      zIndex: 2,
    },
  });

  return (
    <View style={[styles.container, style]}>
      <Image
        source={{ uri: avatarUrl }}
        style={styles.avatar}
      />
      {frameSrc && (
        <Image
          source={{ uri: frameSrc }}
          style={styles.frame}
        />
      )}
    </View>
  );
};

export default AvatarWithFrame;