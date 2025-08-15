import React from 'react';
import type { ChatMessage } from '../types/Chat';
import { useAuth } from '../../auth/AuthContext';
import './ChatMessage.scss';
import { publicUrl } from '../../../untils/publicUrl';


interface ChatMessageProps {
  // Cho phép message không cần có chatroom (vd: chatbot)
  message: ChatMessage | (Omit<ChatMessage, 'chatroom'> & { chatroom?: string });
}

const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message }) => {
  const { user } = useAuth();
  const isSentByMe = message.sender._id === user?._id;

  return (
    <div className={`chat-message-wrapper ${isSentByMe ? 'sent' : 'received'}`}>
      {!isSentByMe && (
        <img
          src={publicUrl(message.sender.avatar) || 'https://placehold.co/28x28/2a2a2a/ffffff?text=U'} // CHANGED
          alt={message.sender.username}
          className="avatar"
        />
      )}

      <div className="message-bubble">
        {!isSentByMe && <strong className="sender-name">{message.sender.username}</strong>}

        {/* Nội dung text (hoặc ảnh nếu bạn render <img/> trong content) */}
        <p className="message-content">{message.content}</p>

        <span className="timestamp">
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

export default ChatMessageComponent;
