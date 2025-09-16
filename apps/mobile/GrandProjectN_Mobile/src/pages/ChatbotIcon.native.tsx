// path: components/ChatbotIcon.native.tsx
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const ChatbotIcon: React.FC = () => {
  const navigation = useNavigation();

  const handlePress = () => {
    // giả định route 'ChatBot' tồn tại trong navigator của bạn
    // nếu tên route khác thì chỉnh lại.
    // @ts-ignore
    navigation.navigate('ChatBot' as never);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.8}>
      <Ionicons name="chatbubble-ellipses-outline" size={28} />
    </TouchableOpacity>
  );
};

export default ChatbotIcon;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
});
