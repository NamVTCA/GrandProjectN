// File: apps/web/src/features/chat/components/ChatMessage.tsx
// Description: Component to display a single chat message.
// Sửa lỗi: Đổi tên component thành ChatMessageComponent và cập nhật logic.

import React from 'react';
import type { ChatMessage } from '../types/Chat';
import { useAuth } from '../../auth/AuthContext';
import './ChatMessage.scss';

interface ChatMessageProps {
  // Cho phép message không cần có chatroom (dùng cho chatbot)
  message: ChatMessage | (Omit<ChatMessage, 'chatroom'> & { chatroom?: string });
}

const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message }) => {
  const { user } = useAuth();
  const isSentByMe = message.sender._id === user?._id;

  return (
    <div className={`chat-message-wrapper ${isSentByMe ? 'sent' : 'received'}`}>
      {!isSentByMe && (
        <img src={message.sender.avatar || 'https://placehold.co/40x40/2a2a2a/ffffff?text=U'} alt={message.sender.username} className="avatar" />
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
