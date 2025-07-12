import React, { useEffect, useState } from 'react';
import api from '../services/api';
import './ChatPage.scss';

interface ChatRoom {
  _id: string;
  name?: string;
  members: { user: { _id: string; username: string; avatar: string }, unreadCount?: number }[];
  isGroupChat: boolean;
}

const ChatPage: React.FC = () => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);

  useEffect(() => {
    api.get('/chat/rooms').then(res => setRooms(res.data));
  }, []);

  const getRoomName = (room: ChatRoom) => {
    if (room.isGroupChat) return room.name;
    // Cần logic để lọc ra user hiện tại
    return room.members[0]?.user.username || 'Phòng chat';
  }

  return (
    <div className="chat-page-layout">
      <div className="sidebar">
        <h2>Tin nhắn</h2>
        <div className="room-list">
          {rooms.map(room => (
            <div key={room._id} className="room-item" onClick={() => setSelectedRoom(room)}>
              {getRoomName(room)}
            </div>
          ))}
        </div>
      </div>
      <div className="main-chat-area">
        {selectedRoom ? (
          <div>
            <h3>{getRoomName(selectedRoom)}</h3>
            <div className="messages-container">
              {/* Hiển thị tin nhắn ở đây */}
            </div>
            <div className="message-input-area">
              <input type="text" placeholder="Nhập tin nhắn..." />
              <button>Gửi</button>
            </div>
          </div>
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