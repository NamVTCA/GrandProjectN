import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface TypingUser {
  username: string;
}

const fmt = (arr: TypingUser[]) => {
  const names = arr.map(x => x.username);
  if (names.length === 0) return '';
  if (names.length === 1) return `${names[0]} đang nhập…`;
  if (names.length === 2) return `${names[0]} và ${names[1]} đang nhập…`;
  if (names.length === 3) return `${names[0]}, ${names[1]} và ${names[2]} đang nhập…`;
  return `${names[0]}, ${names[1]} và ${names.length - 2} người khác đang nhập…`;
};

export default function TypingIndicator({ typers }: { typers: TypingUser[] }) {
  if (!typers.length) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{fmt(typers)}</Text>
      <View style={styles.dots}>
        <Text style={styles.dot}>•</Text>
        <Text style={[styles.dot, { opacity: 0.5 }]}>•</Text>
        <Text style={[styles.dot, { opacity: 0.2 }]}>•</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    color: '#cfd3dc',
    fontSize: 13,
  },
  dots: {
    flexDirection: 'row',
    width: 24,
    justifyContent: 'space-between',
  },
  dot: {
    fontSize: 16,
    color: '#cfd3dc',
  },
});
