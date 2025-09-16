import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

type Props = { room: any | null };

const ChatHeader: React.FC<Props> = ({ room }) => {
  if (!room) return null;

  const title = room.ui?.title || room.name || 'Đoạn chat';
  const avatar = room.ui?.avatar || room.avatar;

  const styles = StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: '#1a1a1a',
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
    },
    placeholder: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#333',
      marginRight: 12,
    },
    title: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.header}>
      {avatar ? (
        <Image source={{ uri: avatar }} style={styles.avatar} />
      ) : (
        <View style={styles.placeholder} />
      )}
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

export default ChatHeader;