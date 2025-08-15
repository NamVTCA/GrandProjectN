import React, { useEffect, useState, useRef, useCallback } from 'react';
import api from '../services/api';
import { useSocket } from '../hooks/useSocket';
import type { ChatRoom, ChatMessage } from '../features/chat/types/Chat';
import ChatMessageComponent from '../features/chat/components/ChatMessage';
import { useAuth } from '../features/auth/AuthContext';
import './ChatPage.scss';
import { publicUrl } from '../untils/publicUrl';
import type { PickableUser } from '../features/chat/components/CreateGroupModal';
import CreateGroupModal from '../features/chat/components/CreateGroupModal';

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const chatSocket = useSocket();

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const [openCreate, setOpenCreate] = useState(false);
  const [friends, setFriends] = useState<PickableUser[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // FE-only: preview avatar ngay sau khi tạo
  const [roomAvatarPreview, setRoomAvatarPreview] = useState<Record<string, string>>({});
  useEffect(() => () => {
    Object.values(roomAvatarPreview).forEach(u => URL.revokeObjectURL(u));
  }, [roomAvatarPreview]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentRoomIdRef = useRef<string | null>(null);

  const fetchRooms = useCallback(async () => {
    try {
      setLoadingRooms(true);
      const res = await api.get('/chat/rooms');
      setRooms(res.data);
    } catch (e) {
      console.error('Load rooms failed', e);
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  const getRoomDetails = (room: ChatRoom) => {
    if (room.isGroupChat) {
      const preview = roomAvatarPreview[room._id];
      const real = (room as any).avatar ? publicUrl((room as any).avatar) : undefined;
      return {
        name: room.name || 'Nhóm chat',
        avatar: preview || real || 'https://via.placeholder.com/48',
      };
    }
    const otherMember = room.members.find(m => m.user._id !== user?._id);
    return {
      name: otherMember?.user.username || 'Người dùng không xác định',
      avatar: publicUrl(otherMember?.user.avatar) || 'https://via.placeholder.com/48',
    };
  };

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const updateRoomsByIncoming = useCallback(
    (msg: ChatMessage) => {
      setRooms(prev =>
        prev.map(r => {
          if (r._id !== msg.chatroom) return r;
          const isOpen = selectedRoom?._id === r._id;
          return {
            ...r,
            lastMessage: msg,
            members: r.members.map(m =>
              m.user._id === user?._id
                ? { ...m, unreadCount: isOpen ? 0 : (m.unreadCount || 0) + 1 }
                : m
            ),
          };
        })
      );
    },
    [selectedRoom?._id, user?._id]
  );

  useEffect(() => {
    if (!chatSocket) return;

    // nhận phòng mới do ai đó tạo (BE emit)
    const onRoomCreated = (room: ChatRoom) => {
      setRooms(prev => (prev.some(r => r._id === room._id) ? prev : [room, ...prev]));
    };

    const handleNewMessage = (message: ChatMessage) => {
      // Nếu là room mới mà client chưa biết → fetch list để lấy đủ avatar, name...
      setRooms(prev => {
        const exists = prev.some(r => r._id === message.chatroom);
        if (!exists) fetchRooms();
        return prev;
      });

      if (message.chatroom === selectedRoom?._id) {
        setMessages(prev => [...prev, message]);
      }
      updateRoomsByIncoming(message);
    };

    const handleRoomMarkedAsRead = ({ chatroomId }: { chatroomId: string }) => {
      setRooms(prev =>
        prev.map(r =>
          r._id === chatroomId
            ? {
                ...r,
                members: r.members.map(m =>
                  m.user._id === user?._id ? { ...m, unreadCount: 0 } : m
                ),
              }
            : r
        )
      );
    };

    const handleConnect = () => {
      if (currentRoomIdRef.current) {
        chatSocket.emit('joinRoom', { chatroomId: currentRoomIdRef.current });
      }
    };

    chatSocket.on('connect', handleConnect);
    chatSocket.on('newMessage', handleNewMessage);
    chatSocket.on('room_marked_as_read', handleRoomMarkedAsRead);
    chatSocket.on('room_created', onRoomCreated); // <-- NEW

    return () => {
      chatSocket.off('connect', handleConnect);
      chatSocket.off('newMessage', handleNewMessage);
      chatSocket.off('room_marked_as_read', handleRoomMarkedAsRead);
      chatSocket.off('room_created', onRoomCreated);
    };
  }, [chatSocket, selectedRoom?._id, updateRoomsByIncoming, user?._id, fetchRooms]);

  const handleSelectRoom = useCallback(
    async (room: ChatRoom) => {
      if (chatSocket && currentRoomIdRef.current) {
        chatSocket.emit('leaveRoom', { chatroomId: currentRoomIdRef.current });
      }
      setSelectedRoom(room);
      currentRoomIdRef.current = room._id;

      if (chatSocket) {
        chatSocket.emit('joinRoom', { chatroomId: room._id });
      }

      const response = await api.get(`/chat/rooms/${room._id}/messages`);
      setMessages(response.data);

      if (chatSocket) {
        chatSocket.emit('mark_room_as_read', { chatroomId: room._id });
      }

      setRooms(prev =>
        prev.map(r =>
          r._id === room._id
            ? {
                ...r,
                members: r.members.map(m =>
                  m.user._id === user?._id ? { ...m, unreadCount: 0 } : m
                ),
              }
            : r
        )
      );
    },
    [chatSocket, user?._id]
  );

  const openOrCreateDM = useCallback(
    async (friendId: string) => {
      try {
        const res = await api.post('/chat/rooms', { memberIds: [friendId] });
        const room: ChatRoom = res.data;
        setRooms(prev => (prev.some(r => r._id === room._id) ? prev : [room, ...prev]));
        await handleSelectRoom(room);
      } catch (e) {
        console.error('openOrCreateDM error', e);
      }
    },
    [handleSelectRoom]
  );

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { friendId: string };
      if (detail?.friendId) openOrCreateDM(detail.friendId);
    };
    window.addEventListener('open-dm', handler as EventListener);
    return () => window.removeEventListener('open-dm', handler as EventListener);
  }, [openOrCreateDM]);

  useEffect(() => {
    return () => {
      if (chatSocket && currentRoomIdRef.current) {
        chatSocket.emit('leaveRoom', { chatroomId: currentRoomIdRef.current });
      }
    };
  }, [chatSocket]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatSocket || !selectedRoom) return;

    chatSocket.emit('sendMessage', {
      chatroomId: selectedRoom._id,
      content: newMessage.trim(),
    });
    setNewMessage('');
  };

  const openCreateModal = async () => {
    setOpenCreate(true);
    if (loadingFriends || friends.length) return;
    setLoadingFriends(true);
    try {
      let data: any = null;
      try {
        const r1 = await api.get('/friends/me');
        data = r1.data;
      } catch {}
      if (!data) {
        const r2 = await api.get('/friends');
        data = r2.data;
      }

      const raw: any[] =
        (data?.friends ?? data?.friendList ?? data?.items ?? data ?? []) as any[];

      const mapped: PickableUser[] = raw.flatMap((it: any) => {
        const c =
          it?.user ?? it?.friend ?? it?.friendUser ?? it?.target ?? it?.receiver ??
          it?.to ?? it?.toUser ?? it?.from ?? it?.requester ?? it?.sender ?? it;

        const id = c?._id ?? c?.id;
        const username =
          c?.username ?? c?.name ?? c?.displayName ?? c?.fullName ?? 'Không tên';

        const avatarRaw =
          c?.avatar ?? c?.photo ?? c?.imageUrl ?? c?.photoURL ?? c?.picture ?? null;
        const avatar = avatarRaw ? publicUrl(avatarRaw) : null;

        return id ? [{ id, username, avatar }] : [];
      });

      setFriends(mapped);
    } catch (e) {
      console.error('Load friends error', e);
      setFriends([]);
    } finally {
      setLoadingFriends(false);
    }
  };

  const createGroup = async ({
    name,
    memberIds,
    avatarFile,
  }: {
    name: string;
    memberIds: string[];
    avatarFile?: File | null;
  }) => {
    try {
      const ids = Array.from(new Set(memberIds));

      if (ids.length === 1 && !avatarFile) {
        await openOrCreateDM(ids[0]);
        return;
      }

      let res;
      if (avatarFile) {
        const form = new FormData();
        form.append('name', name ?? '');
        ids.forEach(id => form.append('memberIds', id));
        form.append('avatar', avatarFile);
        res = await api.post('/chat/rooms', form);

        // Preview tạm cho người tạo
        const newId: string | undefined =
          res.data?._id ?? res.data?.room?._id ?? res.data?.data?._id;
        if (newId) {
          const url = URL.createObjectURL(avatarFile);
          setRoomAvatarPreview(prev => ({ ...prev, [newId]: url }));
        }
      } else {
        res = await api.post('/chat/rooms', { name: name || undefined, memberIds: ids });
      }

      const roomFromRes: ChatRoom | undefined =
        res.data?.room ?? res.data?.data ?? (res.data && res.data._id ? res.data : undefined);

      if (roomFromRes) {
        setRooms(prev => (prev.some(r => r._id === roomFromRes._id) ? prev : [roomFromRes, ...prev]));
        await handleSelectRoom(roomFromRes);
      }

      // Đồng bộ lại để có avatar thật
      const list = (await api.get('/chat/rooms')).data as ChatRoom[];
      setRooms(list);

      const createdId: string | undefined =
        res.data?._id ?? res.data?.room?._id ?? res.data?.data?._id;
      if (createdId) {
        const found = list.find(r => r._id === createdId && (r as any).avatar);
        if (found && roomAvatarPreview[createdId]) {
          URL.revokeObjectURL(roomAvatarPreview[createdId]);
          setRoomAvatarPreview(prev => {
            const copy = { ...prev };
            delete copy[createdId];
            return copy;
          });
        }
        if (found) await handleSelectRoom(found);
      }
    } catch (e) {
      console.error('Create group error', e);
      await fetchRooms();
    }
  };

  const headerInfo = selectedRoom ? getRoomDetails(selectedRoom) : null;

  return (
    <div className="chat-page-layout">
      <div className="sidebar">
        <h2>Tin nhắn</h2>

        <div style={{ padding: 12 }}>
          <button className="btn btn-primary w-100" onClick={openCreateModal} disabled={loadingRooms}>
            + Tạo nhóm
          </button>
        </div>

        <div className="room-list">
          {rooms.map(room => {
            const details = getRoomDetails(room);
            const mine = room.members.find(m => m.user._id === user?._id);
            const unread = mine?.unreadCount || 0;
            const active = selectedRoom?._id === room._id;
            return (
              <div
                key={room._id}
                className={`room-item ${active ? 'active' : ''}`}
                onClick={() => handleSelectRoom(room)}
              >
                <img src={details.avatar} alt={details.name} className="room-avatar" />
                <div className="room-info">
                  <div className="room-top">
                    <span className="room-name">{details.name}</span>
                    {unread > 0 && <span className="badge">{unread}</span>}
                  </div>
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
              <div className="peer">
                <img
                  className="peer-avatar"
                  src={headerInfo?.avatar || 'https://via.placeholder.com/48'}
                  alt={headerInfo?.name || ''}
                />
                <div className="peer-meta">
                  <h3 className="peer-name">{headerInfo?.name}</h3>
                  <small className="peer-sub">
                    {selectedRoom.isGroupChat
                      ? `${selectedRoom.members.length} thành viên`
                      : 'Trò chuyện'}
                  </small>
                </div>
              </div>
              <div className="chat-actions" />
            </header>

            <div className="messages-container">
              {messages.map(msg => (
                <ChatMessageComponent key={msg._id} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form className="message-input-area" onSubmit={handleSendMessage}>
              <input
                type="text"
                placeholder="Nhập tin nhắn..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button type="submit" disabled={!newMessage.trim()}>
                Gửi
              </button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            <p>Chọn một cuộc trò chuyện để bắt đầu</p>
          </div>
        )}
      </div>

      <CreateGroupModal
        open={openCreate}
        friends={friends}
        onClose={() => setOpenCreate(false)}
        onCreate={createGroup}
      />
    </div>
  );
};

export default ChatPage;
