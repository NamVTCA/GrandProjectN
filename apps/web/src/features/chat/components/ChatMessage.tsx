// File: src/features/chat/components/ChatMessage.tsx (Đã sửa lỗi)
import React from 'react';
import type { ChatMessage } from '../types/Chat';
import { useAuth } from '../../auth/AuthContext';
import './ChatMessage.scss';

interface ChatMessageProps {
  message: ChatMessage;
}

// SỬA LỖI: Đổi tên component để tránh xung đột với tên của `type ChatMessage`
const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message }) => {
  const { user } = useAuth();
  const isSentByMe = message.sender._id === user?._id;

  return (
    <div className={`chat-message-wrapper ${isSentByMe ? 'sent' : 'received'}`}>
      {!isSentByMe && (
        <img src={message.sender.avatar || 'https://via.placeholder.com/40'} alt={message.sender.username} className="avatar" />
      )}
      <div className="message-bubble">
        {!isSentByMe && <strong className="sender-name">{message.sender.username}</strong>}
        <p className="message-content">{message.content}</p>
        <span className="timestamp">{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  );
};

export default ChatMessageComponent;