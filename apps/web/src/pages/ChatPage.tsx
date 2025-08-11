import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '../services/api';
import { useSocket } from '../hooks/useSocket';
import type { ChatRoom, ChatMessage } from '../features/chat/types/Chat';
import ChatMessageComponent from '../features/chat/components/ChatMessage';
import { useAuth } from '../features/auth/AuthContext';
import './ChatPage.scss';

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const chatSocket = useSocket('chat');

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getRoomDetails = (room: ChatRoom) => {
    if (room.isGroupChat) {
      return { name: room.name || 'Nhóm chat', avatar: 'https://via.placeholder.com/48' };
    }
    const otherMember = room.members.find(m => m.user._id !== user?._id);
    return { 
      name: otherMember?.user.username || 'Người dùng không xác định',
      avatar: otherMember?.user.avatar || 'https://via.placeholder.com/48'
    };
  };

  useEffect(() => {
    api.get('/chat/rooms').then(res => setRooms(res.data));
  }, []);

  useEffect(() => {
    if (!chatSocket) return;
    const handleNewMessage = (message: ChatMessage) => {
      if (message.chatroom === selectedRoom?._id) {
        setMessages(prev => [...prev, message]);
      }
    };
    chatSocket.on('newMessage', handleNewMessage);
    return () => { chatSocket.off('newMessage', handleNewMessage); };
  }, [chatSocket, selectedRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectRoom = async (room: ChatRoom) => {
    setSelectedRoom(room);
    const response = await api.get(`/chat/rooms/${room._id}/messages`);
    setMessages(response.data);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatSocket || !selectedRoom) return;
    
    chatSocket.emit('sendMessage', {
      chatroomId: selectedRoom._id,
      content: newMessage,
    });
    setNewMessage('');
  };

  return (
    <div className="chat-page-layout">
      <div className="sidebar">
        <h2>Tin nhắn</h2>
        <div className="room-list">
          {rooms.map(room => {
            const details = getRoomDetails(room);
            return (
              <div key={room._id} className={`room-item ${selectedRoom?._id === room._id ? 'active' : ''}`} onClick={() => handleSelectRoom(room)}>
                <img src={details.avatar} alt={details.name} className="room-avatar" />
                <div className="room-info">
                  <span className="room-name">{details.name}</span>
                  <p className="last-message">{room.lastMessage?.content}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="main-chat-area">
        {selectedRoom ? (
          <>
            <header className="chat-header">
              <h3>{getRoomDetails(selectedRoom).name}</h3>
            </header>
            <div className="messages-container">
              {messages.map(msg => <ChatMessageComponent key={msg._id} message={msg} />)}
              <div ref={messagesEndRef} />
            </div>
            <form className="message-input-area" onSubmit={handleSendMessage}>
              <input type="text" placeholder="Nhập tin nhắn..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
              <button type="submit">Gửi</button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            <p>Chọn một cuộc trò chuyện để bắt đầu</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;