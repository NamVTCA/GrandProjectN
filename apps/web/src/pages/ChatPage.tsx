import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../features/auth/AuthContext';
import './ChatPage.scss'; // Import your styles here

// Cập nhật các kiểu dữ liệu để khớp với Backend
interface Message {
  _id: string;
  sender: { _id: string; username: string; avatar: string };
  content: string;
  createdAt: string;
  chatroom: string; // <-- Thêm trường này
}
interface ChatRoom {
  _id: string;
  name?: string;
  isGroupChat: boolean; // <-- Thêm trường này
  members: { user: { _id: string; username: string; avatar: string }, unreadCount?: number }[]; // unreadCount có thể undefined
}

const ChatPage: React.FC = () => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatSocket = useSocket('chat');
  const { user } = useAuth();

  useEffect(() => {
    api.get('/chat/rooms').then(res => setRooms(res.data));
  }, []);

  useEffect(() => {
    if (!chatSocket) return;
    const handleNewMessage = (message: Message) => {
      if (message.chatroom === selectedRoom?._id) {
        setMessages(prev => [...prev, message]);
      }
    };
    chatSocket.on('newMessage', handleNewMessage);
    return () => { chatSocket.off('newMessage', handleNewMessage); };
  }, [chatSocket, selectedRoom]);

  const handleSelectRoom = async (room: ChatRoom) => {
    setSelectedRoom(room);
    const response = await api.get(`/chat/rooms/${room._id}/messages`);
    setMessages(response.data);
    if (chatSocket) {
      chatSocket.emit('mark_room_as_read', { chatroomId: room._id });
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && selectedRoom && chatSocket) {
      chatSocket.emit('sendMessage', {
        chatroomId: selectedRoom._id,
        content: newMessage,
      });
      setNewMessage('');
    }
  };

  const getRoomName = (room: ChatRoom) => {
    if (room.isGroupChat) return room.name;
    const otherMember = room.members.find(m => m.user._id !== user?._id);
    return otherMember?.user.username || 'Phòng chat';
  }

  return (
    <div className="chat-page-layout">
      <div className="sidebar">
        <h2>Tin nhắn</h2>
        <div className="room-list">
          {rooms.map(room => {
            const memberInfo = room.members.find(m => m.user._id === user?._id);
            const unreadCount = memberInfo?.unreadCount ?? 0;

            return (
              <div key={room._id} className="room-item" onClick={() => handleSelectRoom(room)}>
                {getRoomName(room)}
                {unreadCount > 0 && 
                  <span className="unread-badge">{unreadCount}</span>
                }
              </div>
            );
          })}
        </div>
      </div>
      <div className="main-chat-area">
        {selectedRoom ? (
          <>
            <h3>{getRoomName(selectedRoom)}</h3>
            <div className="messages-container">
              {messages.map(msg => (
                <div key={msg._id} className={`message ${msg.sender._id === user?._id ? 'sent' : 'received'}`}>
                  <p>{msg.content}</p>
                </div>
              ))}
            </div>
            <form onSubmit={handleSendMessage} className="message-input-area">
              <input 
                type="text" 
                placeholder="Nhập tin nhắn..." 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button type="submit">Gửi</button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected"><p>Chọn một cuộc trò chuyện để bắt đầu</p></div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
