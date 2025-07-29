// File: apps/web/src/pages/ChatbotPage.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import api ,{ chatWithBot } from '../services/api'; // ✅ dùng hàm riêng
import ChatMessageComponent from '../features/chat/components/ChatMessage';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import type { ChatMessage, ChatParticipant } from '../features/chat/types/Chat';
import './ChatPageBot.scss';

type DisplayMessage = Omit<ChatMessage, 'chatroom'> & { chatroom?: string };

const BOT_SENDER: ChatParticipant = {
  _id: 'chatbot-assistant',
  username: 'Trợ lý ảo',
  avatar: 'https://placehold.co/100x100/7B1FA2/FFFFFF?text=BOT',
};

const ChatbotPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const { reply } = await chatWithBot(currentInput); // ✅ gọi đúng hàm
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

  return (
    <div className="chatbot-page">
      <div className="chat-window">
        <div className="messages-list">
          {messages.map((msg) => (
            <ChatMessageComponent key={msg._id} message={msg} />
          ))}
          {isLoading && (
            <div className="typing-indicator">
              <span>Trợ lý ảo đang soạn tin...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form className="message-input-form" onSubmit={handleSendMessage}>
          <Input
            type="text"
            placeholder="Nhập câu hỏi của bạn..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !inputValue.trim()}>
            Gửi
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatbotPage;
