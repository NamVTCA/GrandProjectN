import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { useAuth } from '../features/auth/AuthContext';
import api, { chatWithBot } from '../services/api';
import type { ChatMessage, ChatParticipant } from '../features/chat/types/chat';

const BOT_SENDER: ChatParticipant = {
  _id: 'chatbot-assistant',
  username: 'Trợ lý ảo',
  avatar: 'https://placehold.co/100x100/7B1FA2/FFFFFF?text=BOT',
};

type DisplayMessage = Omit<ChatMessage, 'chatroom'> & { chatroom?: string };

const ChatbotPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (user) {
      setMessages([
        {
          _id: 'initial-message',
          sender: BOT_SENDER,
          content: `Xin chào ${user.username}! Tôi là trợ lý ảo của bạn. Bạn cần giúp gì về game hoặc các tính năng trên nền tảng không?`,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  }, [user]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !user) return;

    const userMessage: DisplayMessage = {
      _id: `user-${Date.now()}`,
      sender: {
        _id: user._id,
        username: user.username,
        avatar: user.avatar,
      },
      content: inputValue,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      const { reply } = await chatWithBot(currentInput);
      const botMessage: DisplayMessage = {
        _id: `bot-${Date.now()}`,
        sender: BOT_SENDER,
        content: reply,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: DisplayMessage = {
        _id: `error-${Date.now()}`,
        sender: BOT_SENDER,
        content: 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      console.error('Error chatting with bot:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: DisplayMessage }) => {
    const isBot = item.sender._id === BOT_SENDER._id;
    
    return (
      <View style={[styles.messageContainer, isBot ? styles.botMessage : styles.userMessage]}>
        <Image source={{ uri: (item.sender as any).avatar }} style={styles.messageAvatar} />
        <View style={[styles.messageContent, isBot ? styles.botContent : styles.userContent]}>
          <Text style={styles.senderName}>{(item.sender as any).username}</Text>
          <Text style={styles.messageText}>{item.content}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.chatWindow}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item._id}
          style={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          onLayout={() => flatListRef.current?.scrollToEnd()}
        />
        
        {isLoading && (
          <View style={styles.typingIndicator}>
            <Text style={styles.typingText}>Trợ lý ảo đang soạn tin...</Text>
          </View>
        )}
        
        <View style={styles.inputForm}>
          <TextInput
            style={styles.input}
            placeholder="Nhập câu hỏi của bạn..."
            value={inputValue}
            onChangeText={setInputValue}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputValue.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
          >
            <Text style={styles.sendButtonText}>Gửi</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1f24',
  },
  chatWindow: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  botMessage: {
    alignSelf: 'flex-start',
  },
  userMessage: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  messageAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 8,
  },
  messageContent: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 18,
  },
  botContent: {
    backgroundColor: '#2d2e33',
  },
  userContent: {
    backgroundColor: '#4a7cff',
  },
  senderName: {
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
    fontSize: 12,
  },
  messageText: {
    color: '#fff',
  },
  typingIndicator: {
    padding: 8,
    marginLeft: 16,
  },
  typingText: {
    color: '#888',
    fontStyle: 'italic',
    backgroundColor: '#2d2e33',
    padding: 8,
    borderRadius: 12,
    fontSize: 12,
  },
  inputForm: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#2d2e33',
    backgroundColor: '#25262b',
  },
  input: {
    flex: 1,
    backgroundColor: '#2d2e33',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#fff',
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#4a7cff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#555',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default ChatbotPage;