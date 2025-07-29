// File: ChatbotIcon.tsx
import React from 'react';
import { MessageCircle } from 'lucide-react'; // Hoặc dùng icon khác tùy ý
import './ChatbotIcon.scss';
import { useNavigate } from 'react-router-dom';

const ChatbotIcon = () => {
  const navigate = useNavigate();

  return (
    <div className="chatbot-icon" onClick={() => navigate('/chat-bot')}>
      <MessageCircle size={28} />
    </div>
  );
};

export default ChatbotIcon;
