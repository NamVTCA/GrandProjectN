import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

interface AvatarWithFrameProps {
  avatarUrl: string;
  frameAssetUrl?: string;
  size?: number;
}

const AvatarWithFrame: React.FC<AvatarWithFrameProps> = ({
  avatarUrl,
  frameAssetUrl,
  size = 96
}) => {
  const staticUrl = process.env.API_STATIC_URL || '';
  
  const frameSrc = frameAssetUrl
    ? (frameAssetUrl.startsWith('http')
        ? frameAssetUrl
        : `${staticUrl}${frameAssetUrl}`)
    : null;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image
        source={{ uri: avatarUrl }}
        style={[styles.avatar, { width: size - 16, height: size - 16, borderRadius: (size - 16) / 2 }]}
      />
      {frameSrc && (
        <Image
          source={{ uri: frameSrc }}
          style={[styles.frame, { width: size, height: size }]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    position: 'absolute',
  },
  frame: {
    position: 'absolute',
  },
});

export default AvatarWithFrame;