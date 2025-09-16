import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Size = "sm" | "md";

interface Props {
  count?: number;      
  size?: Size;         
  dot?: boolean;       
  style?: object;      
}

export default function UnreadBadge({
  count = 0,
  size = "sm",
  dot = false,
  style = {},
}: Props) {
  if (!count || count <= 0) return null;

  if (dot) {
    return <View style={[styles.dot, style]} />;
  }

  return (
    <View
      style={[
        styles.badge,
        size === "md" ? styles.badgeMd : styles.badgeSm,
        style,
      ]}
    >
      <Text style={styles.text}>{count > 99 ? "99+" : count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'red',
  },
  badge: {
    minWidth: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: 'red',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSm: {
    height: 18,
  },
  badgeMd: {
    height: 24,
    minWidth: 24,
    borderRadius: 12,
  },
  text: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
