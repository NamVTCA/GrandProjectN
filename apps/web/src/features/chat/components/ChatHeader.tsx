import React from 'react';

type Props = { room: any | null };

const ChatHeader: React.FC<Props> = ({ room }) => {
  if (!room) return null;

  const title = room.ui?.title || room.name || 'Đoạn chat';
  const avatar = room.ui?.avatar || room.avatar;

  return (
    <div className="chat-header">
      {avatar ? (
        <img className="avatar" src={avatar} alt={title} />
      ) : (
        <div className="avatar placeholder" />
      )}
      <div className="title">{title}</div>
    </div>
  );
};

export default ChatHeader;
