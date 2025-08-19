import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import { useSocket } from '../hooks/useSocket';
import type { ChatRoom, ChatMessage, ChatParticipant } from '../features/chat/types/Chat';
import ChatMessageComponent from '../features/chat/components/ChatMessage';
import { useAuth } from '../features/auth/AuthContext';
import './ChatPage.scss';
import { publicUrl } from '../untils/publicUrl';
import type { PickableUser } from '../features/chat/components/CreateGroupModal';
import CreateGroupModal from '../features/chat/components/CreateGroupModal';
import GroupSettingsModal from '../features/chat/components/GroupSettingsModal';
import { blockUser, unblockUser, getBlockStatus } from '../services/user';

// ---- CustomEvent type cho 'open-dm'
declare global {
  interface WindowEventMap { 'open-dm': CustomEvent<{ userId: string }>; }
}

/* ================== Helpers ================== */
/** Chuẩn hoá room & avatar -> URL đầy đủ để mọi client đều thấy */
function normalizeRoom(room: any): ChatRoom {
  const avatarRaw = room?.avatarUrl || room?.avatar || '';
  return {
    ...room,
    avatarUrl: avatarRaw ? publicUrl(avatarRaw) : undefined,
    members: (room.members || []).map((m: any) => {
      const u = m.user || m;
      const uAvatarRaw =
        u?.profile?.avatarUrl || u?.avatarUrl || u?.avatar || u?.imageUrl || u?.photo || u?.picture || '';
      return { ...m, user: { ...u, avatarUrl: uAvatarRaw ? publicUrl(uAvatarRaw) : undefined } };
    }),
  } as ChatRoom;
}

function mergeRoom(prev?: ChatRoom | null, incoming?: Partial<ChatRoom>): ChatRoom | null {
  if (!incoming && !prev) return null;
  if (!incoming) return prev ?? null;
  if (!prev) return incoming as ChatRoom;
  const merged: ChatRoom = {
    ...prev, ...incoming,
    isGroupChat: incoming.isGroupChat ?? prev.isGroupChat,
    members: (incoming.members && incoming.members.length ? incoming.members : prev.members) as any,
    lastMessage: (incoming as any).lastMessage ?? prev.lastMessage,
    avatarUrl: (incoming as any).avatarUrl ?? prev.avatarUrl,
    avatar: (incoming as any).avatar ?? prev.avatar,
  };
  return merged;
}
function upsertRooms(prev: ChatRoom[], incoming: ChatRoom): ChatRoom[] {
  const idx = prev.findIndex(r => r._id === incoming._id);
  if (idx < 0) return [incoming, ...prev];
  const merged = mergeRoom(prev[idx], incoming)!;
  const copy = [...prev]; copy[idx] = merged; return copy;
}

/* ================== Component ================== */
const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const chatSocket = useSocket();

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const [openCreate, setOpenCreate] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [friends, setFriends] = useState<PickableUser[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const [blockStatus, setBlockStatus] = useState<{ blockedByMe: boolean; blockedMe: boolean } | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const currentRoomIdRef = useRef<string | null>(null);

  // ===== Chống nháy / spam click nút "+ Tạo nhóm"
  const createBtnLockRef = useRef(false);

  // ====== Kebab menu (⋮) trong header
  const [menuOpen, setMenuOpen] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement | null>(null);
  const menuPopupRef = useRef<HTMLDivElement | null>(null);
  const [menuCoords, setMenuCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const MENU_MIN_WIDTH = 180;

  // chặn propagation ở capture-phase – dùng cho nút & popup (diệt “nháy” do global close)
  const stopAllCapture = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // @ts-ignore
    if (e.nativeEvent?.stopImmediatePropagation) e.nativeEvent.stopImmediatePropagation();
  };

  const positionMenu = useCallback(() => {
    const btn = menuBtnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const margin = 8;
    const top = rect.bottom + margin;
    const left = Math.max(
      margin,
      Math.min(window.innerWidth - margin - MENU_MIN_WIDTH, rect.right - MENU_MIN_WIDTH)
    );
    setMenuCoords({ top, left });
  }, []);

  // outside-close: document pointerdown (capture). Nhờ stopAllCapture ở trong, click mở sẽ không “nháy”.
  useEffect(() => {
    if (!menuOpen) return;
    const onDocPD = (ev: PointerEvent) => {
      const t = ev.target as Node | null;
      if (!t) return setMenuOpen(false);
      if (menuBtnRef.current?.contains(t)) return;
      if (menuPopupRef.current?.contains(t)) return;
      setMenuOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    const onResize = () => positionMenu();

    document.addEventListener('pointerdown', onDocPD, true); // capture
    document.addEventListener('keydown', onEsc);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('pointerdown', onDocPD, true);
      document.removeEventListener('keydown', onEsc);
      window.removeEventListener('resize', onResize);
    };
  }, [menuOpen, positionMenu]);

  const fetchRooms = useCallback(async () => {
    try {
      setLoadingRooms(true);
      const res = await api.get('/chat/rooms');
      setRooms((res.data || []).map(normalizeRoom)); // ✅ chuẩn hoá avatar
    } catch (e) {
      console.error('Load rooms failed', e);
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  const fetchFriends = useCallback(async () => {
    if (loadingFriends) return;
    setLoadingFriends(true);
    try {
      let data: any = null;
      try { data = (await api.get('/friends/me')).data; } catch {}
      if (!data) data = (await api.get('/friends')).data;

      const raw: any[] = (data?.friends ?? data?.friendList ?? data?.items ?? data ?? []) as any[];
      const mapped: PickableUser[] = raw.flatMap((it: any) => {
        const c =
          it?.user ?? it?.friend ?? it?.friendUser ?? it?.target ?? it?.receiver ??
          it?.to ?? it?.toUser ?? it?.from ?? it?.requester ?? it?.sender ?? it;
        const id = c?._id ?? c?.id;
        const username = c?.username ?? c?.name ?? c?.displayName ?? c?.fullName ?? 'Không tên';
        const avatarRaw =
          c?.profile?.avatarUrl ?? c?.avatar ?? c?.photo ?? c?.imageUrl ?? c?.photoURL ?? c?.picture ?? null;
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
  }, [loadingFriends]);

  useEffect(() => { fetchRooms(); fetchFriends(); }, [fetchRooms, fetchFriends]);

  // Cuộn xuống cuối KHUNG TIN NHẮN (không cuộn toàn trang)
  useEffect(() => {
    const box = messagesContainerRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [messages]);

  const getPeer = (room: ChatRoom): ChatParticipant | undefined =>
    room.members.find((m) => m.user._id !== user?._id)?.user;

  const getRoomDetails = (room: ChatRoom) => {
    if (room.isGroupChat) {
      const avatar = room.avatarUrl || room.avatar || '';
      return { name: room.name || 'Nhóm chat', avatar: avatar ? publicUrl(avatar) : '/images/default-group.png' };
    }
    const other = getPeer(room);
    const raw =
      other?.profile?.avatarUrl || other?.avatar || other?.imageUrl || other?.photo || other?.picture || '';
    return { name: other?.username || 'Người dùng', avatar: raw ? publicUrl(raw) : '/images/default-user.png' };
  };

  const updateRoomsByIncoming = useCallback(
    (msg: ChatMessage) => {
      setRooms((prev) =>
        prev.map((r) => {
          if (r._id !== msg.chatroom) return r;
          const isOpen = selectedRoom?._id === r._id;
          return {
            ...r,
            lastMessage: msg,
            members: r.members.map((m) =>
              m.user._id === user?._id ? { ...m, unreadCount: isOpen ? 0 : (m.unreadCount || 0) + 1 } : m
            ),
          };
        })
      );
    },
    [selectedRoom?._id, user?._id]
  );

  useEffect(() => {
    if (!chatSocket) return;

    // ✅ mọi room qua socket đều normalize để avatar hiện cho tất cả
    const onRoomCreated = (room: ChatRoom) => setRooms(prev => upsertRooms(prev, normalizeRoom(room)));

    const handleNewMessage = (message: ChatMessage) => {
      setRooms((prev) => {
        const exists = prev.some((r) => r._id === message.chatroom);
        if (!exists) fetchRooms();
        return prev;
      });
      if (message.chatroom === selectedRoom?._id) setMessages((prev) => [...prev, message]);
      updateRoomsByIncoming(message);
    };

    const handleRoomMarkedAsRead = ({ chatroomId }: { chatroomId: string }) => {
      setRooms((prev) =>
        prev.map((r) =>
          r._id === chatroomId
            ? { ...r, members: r.members.map((m) => m.user._id === user?._id ? { ...m, unreadCount: 0 } : m) }
            : r
        )
      );
    };

    const onMembersAdded = (payload: any) => {
      const room: ChatRoom = normalizeRoom(payload?.room ?? payload);
      if (!room?._id) return;
      setRooms(prev => upsertRooms(prev, room));
      setSelectedRoom(prevSel => (prevSel && prevSel._id === room._id ? mergeRoom(prevSel, room) : prevSel));
    };

    const onMemberRemoved = (payload: any) => {
      const room: ChatRoom = normalizeRoom(payload?.room ?? payload);
      if (room?._id) {
        setRooms(prev => upsertRooms(prev, room));
        setSelectedRoom(prevSel => {
          if (!prevSel || prevSel._id !== room._id) return prevSel;
          const merged = mergeRoom(prevSel, room);
          if (merged && merged.members.every(m => m.user._id !== (user?._id as string))) return null;
          return merged;
        });
      }
    };

    const onRoomUpdated = (room: ChatRoom) => {
      const r = normalizeRoom(room);
      setRooms(prev => upsertRooms(prev, r));
      setSelectedRoom(prevSel => (prevSel && prevSel._id === r._id ? mergeRoom(prevSel, r) : prevSel));
    };

    const handleConnect = () => {
      if (currentRoomIdRef.current) chatSocket.emit('joinRoom', { chatroomId: currentRoomIdRef.current });
    };

    chatSocket.on('connect', handleConnect);
    chatSocket.on('newMessage', handleNewMessage);
    chatSocket.on('room_marked_as_read', handleRoomMarkedAsRead);
    chatSocket.on('room_created', onRoomCreated);
    chatSocket.on('room_members_added', onMembersAdded);
    chatSocket.on('room_member_removed', onMemberRemoved);
    chatSocket.on('room_updated', onRoomUpdated);

    return () => {
      chatSocket.off('connect', handleConnect);
      chatSocket.off('newMessage', handleNewMessage);
      chatSocket.off('room_marked_as_read', handleRoomMarkedAsRead);
      chatSocket.off('room_created', onRoomCreated);
      chatSocket.off('room_members_added', onMembersAdded);
      chatSocket.off('room_member_removed', onMemberRemoved);
      chatSocket.off('room_updated', onRoomUpdated);
    };
  }, [chatSocket, selectedRoom?._id, updateRoomsByIncoming, user?._id, fetchRooms]);

  const handleSelectRoom = useCallback(
    async (room: ChatRoom) => {
      if (chatSocket && currentRoomIdRef.current) {
        chatSocket.emit('leaveRoom', { chatroomId: currentRoomIdRef.current });
      }
      setSelectedRoom(room);
      currentRoomIdRef.current = room._id;

      if (chatSocket) chatSocket.emit('joinRoom', { chatroomId: room._id });

      const response = await api.get(`/chat/rooms/${room._id}/messages`);
      setMessages(response.data);

      if (chatSocket) chatSocket.emit('mark_room_as_read', { chatroomId: room._id });

      setRooms((prev) =>
        prev.map((r) =>
          r._id === room._id
            ? { ...r, members: r.members.map((m) => m.user._id === user?._id ? { ...m, unreadCount: 0 } : m) }
            : r
        )
      );

      if (!room.isGroupChat) {
        const peer = getPeer(room);
        if (peer?._id) {
          try { setBlockStatus(await getBlockStatus(peer._id)); }
          catch { setBlockStatus(null); }
        } else setBlockStatus(null);
      } else {
        setBlockStatus(null);
      }
      setMenuOpen(false);
    },
    [chatSocket, user?._id]
  );

  const openOrCreateDM = useCallback(
    async (friendId: string) => {
      try {
        const res = await api.post('/chat/rooms', { memberIds: [friendId] });
        const room: ChatRoom = normalizeRoom(res.data?.room ?? res.data);
        setRooms((prev) => (prev.some((r) => r._id === room._id) ? prev : [room, ...prev]));
        await handleSelectRoom(room);
      } catch (e) {
        console.error('openOrCreateDM error', e);
      }
    },
    [handleSelectRoom]
  );

  // Lắng nghe 'open-dm' từ Rightbar khi đang ở trang /chat
  useEffect(() => {
    const handler = (e: WindowEventMap['open-dm']) => {
      const id = e?.detail?.userId;
      if (id) openOrCreateDM(id);
    };
    window.addEventListener('open-dm', handler);
    return () => window.removeEventListener('open-dm', handler);
  }, [openOrCreateDM]);

  useEffect(() => () => {
    if (chatSocket && currentRoomIdRef.current) {
      chatSocket.emit('leaveRoom', { chatroomId: currentRoomIdRef.current });
    }
  }, [chatSocket]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatSocket || !selectedRoom) return;
    if (!selectedRoom.isGroupChat && blockStatus && (blockStatus.blockedByMe || blockStatus.blockedMe)) return;
    chatSocket.emit('sendMessage', { chatroomId: selectedRoom._id, content: newMessage.trim() });
    setNewMessage('');
  };

  /* ===== Tạo nhóm ===== */
  const openCreateModal = async () => {
    // dùng lock để tránh nháy và spam, không cần disabled -> giữ nguyên màu & con trỏ
    if (createBtnLockRef.current) return;
    createBtnLockRef.current = true;

    setMenuOpen(false);
    setOpenCreate(true);
    if (!friends.length) await fetchFriends();

    setTimeout(() => { createBtnLockRef.current = false; }, 300);
  };

  const createGroup = async ({
    name,
    memberIds,
    avatarFile,
  }: { name: string; memberIds: string[]; avatarFile?: File | null; }) => {
    try {
      const ids = Array.from(new Set(memberIds));
      if (ids.length === 1 && !avatarFile) { await openOrCreateDM(ids[0]); return; }

      let res;
      if (avatarFile) {
        const form = new FormData();
        form.append('name', name ?? '');
        ids.forEach((id) => form.append('memberIds', id));
        form.append('avatar', avatarFile);
        res = await api.post('/chat/rooms', form);
      } else {
        res = await api.post('/chat/rooms', { name: name || undefined, memberIds: ids });
      }

      const roomFromRes: ChatRoom = normalizeRoom(res.data?.room ?? res.data);
      if (roomFromRes?._id) {
        setRooms((prev) => (prev.some((r) => r._id === roomFromRes._id) ? prev : [roomFromRes, ...prev]));
        await handleSelectRoom(roomFromRes);
      }

      // đồng bộ thêm từ server (đã normalize trong fetchRooms)
      await fetchRooms();
    } catch (e) {
      console.error('Create group error', e);
      await fetchRooms();
    }
  };

  const headerInfo = selectedRoom ? getRoomDetails(selectedRoom) : null;
  const isGroup = selectedRoom ? (selectedRoom.isGroupChat ?? ((selectedRoom.members?.length || 0) > 2)) : false;

  const sendingDisabled =
    !newMessage.trim() ||
    !selectedRoom ||
    (!isGroup && !!blockStatus && (blockStatus.blockedByMe || blockStatus.blockedMe));

  // ===== MENU ITEMS cho ⋮
  const menuItems = (() => {
    if (!selectedRoom) return [] as { key: string; label: string; danger?: boolean; disabled?: boolean; onClick: () => void | Promise<void> }[];
    if (isGroup) {
      return [
        { key: 'settings', label: 'Cài đặt nhóm', onClick: async () => { setOpenCreate(false); await fetchFriends(); setOpenSettings(true); } },
        { key: 'add-members', label: 'Thêm thành viên', onClick: async () => { setOpenCreate(false); await fetchFriends(); setOpenSettings(true); } },
        {
          key: 'leave', label: 'Rời nhóm', danger: true,
          onClick: async () => {
            try {
              await api.delete(`/chat/rooms/${selectedRoom._id}/members/me`);
              setSelectedRoom(null);
              await fetchRooms();
            } catch (e) { console.error('Leave group failed', e); }
          },
        },
      ];
    } else {
      const peer = selectedRoom ? getPeer(selectedRoom) : undefined;
      return [
        { key: 'profile', label: 'Xem hồ sơ', onClick: () => { if (peer?._id) window.open(`/profile/${peer._id}`, '_blank'); } },
        {
          key: 'toggle-block',
          label: blockStatus?.blockedByMe ? 'Bỏ chặn người này' : (blockStatus?.blockedMe ? 'Bạn bị chặn' : 'Chặn người này'),
          danger: !blockStatus?.blockedByMe && !blockStatus?.blockedMe,
          disabled: !!blockStatus?.blockedMe && !blockStatus?.blockedByMe,
          onClick: async () => {
            if (!peer?._id) return;
            try {
              const st = await getBlockStatus(peer._id);
              if (st.blockedByMe) await unblockUser(peer._id);
              else await blockUser(peer._id);
              setBlockStatus(await getBlockStatus(peer._id));
            } catch (e) { console.error('toggle block failed', e); }
          },
        },
      ];
    }
  })();

  return (
    <div className="chat-page-layout">
      <div className="sidebar">
        <h2>Tin nhắn</h2>
        <div style={{ padding: 12 }}>
          {/* Giữ nguyên class/màu sắc; không disabled để tránh con trỏ "cấm" khi hover */}
          <button className="btn btn-primary w-100" onClick={openCreateModal}>
            + Tạo nhóm
          </button>
        </div>

        <div className="room-list">
          {rooms.map((room) => {
            const details = getRoomDetails(room);
            const mine = room.members.find((m) => m.user._id === user?._id);
            const unread = mine?.unreadCount || 0;
            const active = selectedRoom?._id === room._id;
            return (
              <div key={room._id} className={`room-item ${active ? 'active' : ''}`} onClick={() => handleSelectRoom(room)}>
                <img
                  src={details.avatar}
                  alt={details.name}
                  className="room-avatar"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = room.isGroupChat ? '/images/default-group.png' : '/images/default-user.png'; }}
                />
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
                  src={headerInfo?.avatar || '/images/default-group.png'}
                  alt={headerInfo?.name || ''}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/default-group.png'; }}
                />
                <div className="peer-meta">
                  <h3 className="peer-name">{headerInfo?.name}</h3>
                  <small className="peer-sub">
                    {isGroup ? `${selectedRoom.members.length} thành viên` : 'Trò chuyện'}
                  </small>
                </div>
              </div>

              {/* ⋮ trong header */}
              <div className="chat-actions">
                <button
                  ref={menuBtnRef}
                  className="fab-btn header-kebab"
                  title={isGroup ? 'Tùy chọn nhóm' : (blockStatus?.blockedByMe ? 'Bỏ chặn' : 'Tùy chọn')}
                  onPointerDownCapture={(e) => {
                    stopAllCapture(e);
                    if (!menuOpen) positionMenu();
                    setMenuOpen(v => !v);
                    setOpenCreate(false);
                  }}
                >
                  ⋮
                </button>

                {menuOpen && createPortal(
                  <div
                    ref={menuPopupRef}
                    className="kebab-menu__popup"
                    style={{ position: 'fixed', top: menuCoords.top, left: menuCoords.left, minWidth: MENU_MIN_WIDTH }}
                    role="menu"
                    onPointerDownCapture={stopAllCapture}
                    onClickCapture={stopAllCapture}
                  >
                    {menuItems.map((it) => {
                      const disabled = !!it.disabled;
                      return (
                        <button
                          key={it.key}
                          role="menuitem"
                          className={`kebab-menu__item ${it.danger ? 'is-danger' : ''} ${disabled ? 'is-disabled' : ''}`}
                          disabled={disabled}
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            try { await it.onClick(); } catch (err) { console.error('Menu item error', err); }
                            setMenuOpen(false);
                          }}
                        >
                          {it.label}
                        </button>
                      );
                    })}
                  </div>,
                  document.body
                )}
              </div>
            </header>

            {/* Banner chặn (1–1) */}
            {!isGroup && blockStatus && (blockStatus.blockedByMe || blockStatus.blockedMe) && (
              <div className="block-banner">
                {blockStatus.blockedByMe
                  ? 'Bạn đã chặn người này. Hãy bỏ chặn để tiếp tục trò chuyện.'
                  : 'Người này đã chặn bạn. Bạn không thể nhắn tin.'}
              </div>
            )}

            <div className="messages-container" ref={messagesContainerRef}>
              {messages.map((msg) => <ChatMessageComponent key={msg._id} message={msg} />)}
            </div>

            <form className="message-input-area" onSubmit={handleSendMessage}>
              <input
                type="text"
                placeholder={!isGroup && blockStatus && (blockStatus.blockedByMe || blockStatus.blockedMe)
                  ? 'Không thể nhắn do đang bị chặn'
                  : 'Nhập tin nhắn...'}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={!isGroup && !!blockStatus && (blockStatus.blockedByMe || blockStatus.blockedMe)}
              />
              <button type="submit" disabled={sendingDisabled}>Gửi</button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected"><p>Chọn một cuộc trò chuyện để bắt đầu</p></div>
        )}
      </div>

      <CreateGroupModal
        open={openCreate}
        friends={friends}
        onClose={() => setOpenCreate(false)}
        onCreate={createGroup}
      />

      {selectedRoom && isGroup && (
        <GroupSettingsModal
          open={openSettings}
          meId={user?._id as string}
          room={selectedRoom}
          friends={friends}
          onClose={() => setOpenSettings(false)}
          onUpdated={(room) => {
            const r = normalizeRoom(room);
            setRooms(prev => upsertRooms(prev, r));
            setSelectedRoom(prevSel => (prevSel && prevSel._id === r._id ? mergeRoom(prevSel, r) : prevSel));
          }}
        />
      )}
    </div>
  );
};

export default ChatPage;
