// path: components/CoinPackageCard.native.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  GestureResponderEvent,
} from 'react-native';

export interface CoinPackage {
  _id: string;
  packageId: string;
  name?: string;
  coinsAmount: number;
  price: number;
  currency: string;
}

interface Props {
  coinPackage: CoinPackage;
  isSelected?: boolean;
  onSelect?: (e?: GestureResponderEvent) => void;
}

const formatPrice = (price: number, currency: string) => {
  try {
    // Intl may work on many RN JS engines; fallback nếu không
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(price);
  } catch {
    return `${currency} ${price.toFixed(2)}`;
  }
};

const CoinPackageCard: React.FC<Props> = ({ coinPackage, isSelected, onSelect }) => {
  const formattedPrice = formatPrice(coinPackage.price, coinPackage.currency);

  return (
    <TouchableOpacity
      style={[styles.card, isSelected ? styles.selected : undefined]}
      onPress={onSelect}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.coinIcon}>🪙</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.coinsText}>{coinPackage.coinsAmount} Coins</Text>
        <Text style={styles.priceText}>{formattedPrice}</Text>
      </View>
      <View style={styles.buttonWrapper}>
        <Text style={styles.selectText}>{isSelected ? 'Selected' : 'Select'}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default CoinPackageCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    marginVertical: 8,
  },
  selected: {
    borderWidth: 2,
    borderColor: '#4f46e5',
  },
  iconContainer: {
    marginRight: 12,
  },
  coinIcon: {
    fontSize: 28,
  },
  info: {
    flex: 1,
  },
  coinsText: {
    fontSize: 16,
    fontWeight: '700',
  },
  priceText: {
    fontSize: 14,
    marginTop: 4,
    color: '#444',
  },
  buttonWrapper: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#efefef',
  },
  selectText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
