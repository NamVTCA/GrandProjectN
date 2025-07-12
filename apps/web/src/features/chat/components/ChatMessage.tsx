import React from 'react';
import { useAuth } from '../../auth/AuthContext';
import './ChatMessage.scss';

interface Message {
  _id: string;
  sender: { _id: string; username: string; avatar: string };
  content: string;
  createdAt: string;
}

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
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
        <span className="timestamp">{new Date(message.createdAt).toLocaleTimeString()}</span>
      </div>
    </div>
  );
};

export default ChatMessage;
