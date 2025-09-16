import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import type { ShopItem } from '../../shop/types/Shop';

interface InventoryItemCardProps {
  item: ShopItem;
  equipped?: boolean;
  userAvatarUrl?: string;
  onEquip: (itemId: string) => void;
  onUnequip: (itemId: string) => void;
}

const PLACEHOLDER = 'https://via.placeholder.com/250';
const STATIC_ORIGIN = 'http://localhost:8888';

const InventoryItemCard: React.FC<InventoryItemCardProps> = ({
  item,
  equipped = false,
  userAvatarUrl = 'https://via.placeholder.com/150',
  onEquip,
  onUnequip,
}) => {
  const isFrame = item.type === 'AVATAR_FRAME';

  const toSrc = (u?: string) =>
    !u ? PLACEHOLDER : (u.startsWith('http') ? u : `${STATIC_ORIGIN}${u}`);

  const assetSrc = toSrc(item?.assetUrl);

  return (
    <View style={[styles.container, equipped && styles.equipped]}>
      <View style={styles.preview}>
        {isFrame ? (
          <View style={styles.avatarWithFrame}>
            <Image source={{ uri: userAvatarUrl }} style={styles.avatar} />
            <Image
              source={{ uri: assetSrc }}
              style={styles.frame}
              onError={() => ({ uri: PLACEHOLDER })}
            />
          </View>
        ) : (
          <View style={styles.profilePreview}>
            <Image
              source={{ uri: assetSrc }}
              style={styles.background}
              onError={() => ({ uri: PLACEHOLDER })}
            />
            <View style={styles.overlay}>
              <Image source={{ uri: userAvatarUrl }} style={styles.miniAvatar} />
              <View style={styles.line} />
              <View style={[styles.line, styles.shortLine]} />
            </View>
          </View>
        )}
      </View>

      <View style={styles.details}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.description}>{item.description}</Text>

        <View style={styles.footer}>
          {equipped ? (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => onUnequip(item._id)}
            >
              <Text style={styles.buttonText}>Bỏ trang bị</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => onEquip(item._id)}
            >
              <Text style={styles.buttonText}>Trang bị</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    overflow: 'hidden',
    margin: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  equipped: {
    borderColor: '#4CAF50',
  },
  preview: {
    backgroundColor: '#1A1A1A',
    aspectRatio: 16/9,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  avatarWithFrame: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    position: 'absolute',
    top: 10,
    left: 10,
  },
  frame: {
    width: 100,
    height: 100,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  profilePreview: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  background: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  line: {
    height: 4,
    backgroundColor: '#555',
    borderRadius: 2,
    flex: 1,
    marginHorizontal: 4,
  },
  shortLine: {
    flex: 0.5,
  },
  details: {
    padding: 16,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
  },
  footer: {
    marginTop: 'auto',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#555',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default InventoryItemCard;