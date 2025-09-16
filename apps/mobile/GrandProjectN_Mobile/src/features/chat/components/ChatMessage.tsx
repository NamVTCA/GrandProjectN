import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { useAuth } from "../../auth/AuthContext";

interface ChatMessageProps {
  message: any;
}

const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message }) => {
  const { user } = useAuth();

  const myId = (user as any)?._id || (user as any)?.id;
  const senderId = (message.sender as any)?._id || (message.sender as any)?.id;
  const isSentByMe = !!myId && !!senderId && String(myId) === String(senderId);

  const senderAvatarRaw =
    message.sender?.profile?.avatarUrl ??
    (message.sender as any)?.avatarUrl ??
    (message.sender as any)?.avatar ??
    (message.sender as any)?.imageUrl ??
    (message.sender as any)?.photo ??
    (message.sender as any)?.picture ??
    null;

  const avatarSrc = senderAvatarRaw || "https://placehold.co/28x28/2a2a2a/ffffff?text=U";

  const senderName =
    (message.sender as any)?.username ||
    (message.sender as any)?.name ||
    (message.sender as any)?.displayName ||
    "Người dùng";

  const styles = StyleSheet.create({
    wrapper: {
      flexDirection: 'row',
      maxWidth: '75%',
      marginBottom: 15,
      alignSelf: isSentByMe ? 'flex-end' : 'flex-start',
    },
    sent: {
      flexDirection: 'row-reverse',
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignSelf: 'flex-end',
      marginHorizontal: 10,
    },
    bubble: {
      padding: 12,
      borderRadius: 16,
      backgroundColor: isSentByMe ? '#0077cc' : '#2a2a2a',
    },
    senderName: {
      fontWeight: '600',
      fontSize: 14,
      color: '#3ea6ff',
      marginBottom: 5,
    },
    content: {
      color: 'white',
    },
    timestamp: {
      fontSize: 11,
      color: 'rgba(255, 255, 255, 0.7)',
      textAlign: 'right',
      marginTop: 5,
      marginLeft: 10,
      fontWeight: '500',
    },
  });

  return (
    <View style={[styles.wrapper, isSentByMe && styles.sent]}>
      {!isSentByMe && (
        <Image
          source={{ uri: avatarSrc }}
          style={styles.avatar}
          onError={() => {/* Handle error */}}
        />
      )}

      <View style={styles.bubble}>
        {!isSentByMe && <Text style={styles.senderName}>{senderName}</Text>}
        <Text style={styles.content}>{(message as any)?.content ?? ""}</Text>
        <Text style={styles.timestamp}>
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    </View>
  );
};

export default ChatMessageComponent;