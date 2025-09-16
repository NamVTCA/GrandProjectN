import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import type { ShopItem } from '../types/Shop';

interface ShopItemCardProps {
  item: ShopItem;
  owned?: boolean;
  onPurchase: (itemId: string) => void;
  disabled?: boolean;
}

const PLACEHOLDER = 'https://via.placeholder.com/250';

const ShopItemCard: React.FC<ShopItemCardProps> = ({
  item, owned = false, onPurchase, disabled
}) => {
  const staticUrl = process.env.API_STATIC_URL || '';
  
  const imgSrc = item.assetUrl
    ? (item.assetUrl.startsWith('http')
        ? item.assetUrl
        : `${staticUrl}${item.assetUrl}`)
    : PLACEHOLDER;

  return (
    <View style={styles.container}>
      <View style={styles.preview}>
        <Image
          source={{ uri: imgSrc }}
          style={styles.image}
          onError={() => ({ uri: PLACEHOLDER })}
        />
      </View>

      <View style={styles.details}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.description}>{item.description}</Text>

        <View style={styles.footer}>
          <Text style={styles.price}>{item.price.toLocaleString()} Coins</Text>

          {owned ? (
            <TouchableOpacity style={[styles.button, styles.ownedButton]} disabled>
              <Text style={styles.buttonText}>Đã mua</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.button, disabled && styles.disabledButton]} 
              onPress={() => onPurchase(item._id)}
              disabled={disabled}
            >
              <Text style={styles.buttonText}>Mua</Text>
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
    borderWidth: 1,
    borderColor: '#444',
  },
  preview: {
    backgroundColor: '#1A1A1A',
    aspectRatio: 16/9,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  details: {
    padding: 16,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFD700',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  ownedButton: {
    backgroundColor: '#555',
  },
  disabledButton: {
    backgroundColor: '#333',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default ShopItemCard;