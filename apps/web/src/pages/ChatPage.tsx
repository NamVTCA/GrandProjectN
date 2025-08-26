import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import { useSocket } from '../hooks/useSocket';
import type {
  ChatRoom as TChatRoom,
  ChatMessage as TChatMessage,
  ChatParticipant as TChatParticipant,
} from '../features/chat/types/Chat';
import ChatMessageComponent from '../features/chat/components/ChatMessage';
import { useAuth } from '../features/auth/AuthContext';
import './ChatPage.scss';
import { publicUrl } from '../untils/publicUrl';
import type { PickableUser } from '../features/chat/components/CreateGroupModal';
import CreateGroupModal from '../features/chat/components/CreateGroupModal';
import GroupSettingsModal from '../features/chat/components/GroupSettingsModal';
import { blockUser, unblockUser, getBlockStatus } from '../services/user';
import { leaveRoom } from '../services/chat';
import UnreadBadge from '../features/chat/components/UnreadBadge';
import { useNavigate } from 'react-router-dom';

// Typing
import TypingIndicator from '../features/chat/components/TypingIndicator';
import { useTyping } from '../hooks/useTyping';

// Presence
import { usePresence } from '../hooks/usePresence';

declare global {
  interface WindowEventMap {
    'open-dm': CustomEvent<{ userId: string }>;
    'chat-unread-total': CustomEvent<{ total: number }>;
  }
}

/* ================== Helpers ================== */
const getId = (x: any): string | null => {
  if (!x) return null;
  if (typeof x === 'string' || typeof x === 'number') return String(x);
  if (typeof x === 'object') {
    if (x._id) return String(x._id);
    if (x.id) return String(x.id);
  }
  return null;
};
const getChatroomId = (msg: any): string | null =>
  getId(msg?.chatroom ?? msg?.room ?? msg?.chatRoom ?? msg?.conversation);
const getMyIdFromAuth = (u: any): string | null =>
  getId(u) ?? getId(u?.user) ?? (u?.userId ? String(u.userId) : null) ?? null;

/** ✅ Khóa duy nhất cho message: id || createdAt|senderId|content */
const msgKey = (m: any) => {
  const id = getId(m?._id ?? m?.id ?? m?.messageId ?? m?.clientId);
  if (id) return id;
  const created = m?.createdAt ?? m?.created_at ?? m?.timestamp ?? '';
  const sender = getId(m?.sender) ?? '';
  const content = typeof m?.content === 'string' ? m.content : JSON.stringify(m?.content ?? '');
  return `${created}|${sender}|${content}`;
};

/** Dedupe list message theo msgKey */
const dedupeMessages = (arr: TChatMessage[]) => {
  const map = new Map<string, TChatMessage>();
  for (const m of arr) map.set(msgKey(m), m);
  return Array.from(map.values());
};

/* ⭐ normalize room */
function normalizeRoom(room: any): TChatRoom {
  const avatarRaw = room?.avatarUrl || room?.avatar || '';
  const normMembers = (room?.members || []).map((m: any) => {
    const rawUser = m?.user ?? m?.userId ?? m?.member ?? m;
    let userObj: any;
    if (typeof rawUser === 'string' || typeof rawUser === 'number') userObj = { _id: String(rawUser) };
    else if (rawUser && typeof rawUser === 'object') userObj = { ...rawUser };
    else userObj = {};
    const uAvatarRaw =
      userObj?.profile?.avatarUrl ||
      userObj?.avatarUrl ||
      userObj?.avatar ||
      userObj?.imageUrl ||
      userObj?.photo ||
      userObj?.picture ||
      '';
    if (uAvatarRaw) userObj.avatarUrl = publicUrl(uAvatarRaw);

    return { ...m, user: userObj, unreadCount: m?.unreadCount || 0 };
  });

  return { ...room, avatarUrl: avatarRaw ? publicUrl(avatarRaw) : undefined, members: normMembers } as TChatRoom;
}

function mergeRoom(prev?: TChatRoom | null, incoming?: Partial<TChatRoom>): TChatRoom | null {
  if (!incoming && !prev) return null;
  if (!incoming) return prev ?? null;
  if (!prev) return incoming as TChatRoom;

  const merged: TChatRoom = {
    ...prev,
    ...incoming,
    isGroupChat: incoming.isGroupChat ?? prev.isGroupChat,
    lastMessage: (incoming as any).lastMessage ?? prev.lastMessage,
    avatarUrl: (incoming as any).avatarUrl ?? prev.avatarUrl,
    avatar: (incoming as any).avatar ?? prev.avatar,
    members: prev.members,
  };

  const byId = new Map<string, { user: TChatParticipant; unreadCount?: number }>();
  const put = (m: any) => {
    const uid = getId(m?.user);
    if (!uid) return;
    const old = byId.get(uid);
    byId.set(uid, { ...old, ...m, unreadCount: m.unreadCount ?? old?.unreadCount ?? 0 });
  };
  prev.members.forEach(put);
  (incoming.members ?? []).forEach(put);
  merged.members = Array.from(byId.values());

  return merged;
}

function upsertRooms(prev: TChatRoom[], incoming: TChatRoom): TChatRoom[] {
  const idx = prev.findIndex((r) => String(r._id) === String(incoming._id));
  if (idx < 0) return [incoming, ...prev];
  const merged = mergeRoom(prev[idx], incoming)!;
  const copy = [...prev];
  copy[idx] = merged;
  return copy;
}

/* ================== Component ================== */
const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const chatSocket = useSocket();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState<TChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<TChatRoom | null>(null);
  const [messages, setMessages] = useState<TChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const [openCreate, setOpenCreate] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [friends, setFriends] = useState<PickableUser[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const [blockStatus, setBlockStatus] = useState<{ blockedByMe: boolean; blockedMe: boolean } | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const currentRoomIdRef = useRef<string | null>(null);

  /** ✅ Chặn bind nhiều lần (StrictMode) */
  const listenersBoundRef = useRef(false);

  const createBtnLockRef = useRef(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement | null>(null);
  const menuPopupRef = useRef<HTMLDivElement | null>(null);
  const [menuCoords, setMenuCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const MENU_MIN_WIDTH = 180;

  const [headerFlash, setHeaderFlash] = useState(false);

  const myId = getMyIdFromAuth(user);
  const meUsername = (user as any)?.username || (user as any)?.name || 'Bạn';
  const isMe = (uid?: any) => !!uid && !!myId && String(uid) === String(myId);

  // ✅ Typing
  const { typers, onType, stopTyping } = useTyping({
    socket: chatSocket,
    roomId: selectedRoom?._id,
    me: { id: String(myId || ''), username: meUsername },
  });

  // ✅ Presence
  const { presence, subscribePresence } = usePresence(chatSocket);

  // Fallback client-side unread nếu backend không có “me” trong members[]
  const [clientUnread, setClientUnread] = useState<Record<string, number>>({});

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

    document.addEventListener('pointerdown', onDocPD, true);
    document.addEventListener('keydown', onEsc);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('pointerdown', onDocPD, true);
      document.removeEventListener('keydown', onEsc);
      window.removeEventListener('resize', onResize);
    };
  }, [menuOpen, positionMenu]);

  /* ===== Fetch ===== */
  const fetchRooms = useCallback(async () => {
    try {
      setLoadingRooms(true);
      const res = await api.get('/chat/rooms');
      const normalized = (res.data || []).map(normalizeRoom);
      setRooms(normalized);
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
          it?.user ?? it?.friend ?? it?.friendUser ?? it?.target ??
          it?.receiver ?? it?.to ?? it?.toUser ?? it?.from ??
          it?.requester ?? it?.sender ?? it;
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

  useEffect(() => {
    const box = messagesContainerRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [messages]);

  const getPeer = (room: TChatRoom): TChatParticipant | undefined =>
    room.members.find((m) => !isMe(getId((m as any).user) ?? undefined))?.user;

  const getRoomDetails = (room: TChatRoom) => {
    if (room.isGroupChat) {
      const avatar = room.avatarUrl || room.avatar || '';
      return { name: room.name || 'Nhóm chat', avatar: avatar ? publicUrl(avatar) : '/images/default-group.png' };
    }
    const other = getPeer(room);
    const raw =
      (other as any)?.profile?.avatarUrl || (other as any)?.avatar || (other as any)?.imageUrl ||
      (other as any)?.photo || (other as any)?.picture || '';
    return { name: (other as any)?.username || 'Người dùng', avatar: raw ? publicUrl(raw) : '/images/default-user.png' };
  };

  /* ===== Unread cập nhật khi có message đến ===== */
  const updateRoomsByIncoming = useCallback((msg: TChatMessage) => {
    const roomId = getChatroomId(msg);
    if (!roomId) return;

    const senderId = getId((msg as any)?.sender);
    const fromMe = !!senderId && isMe(senderId);
    const isOpen = !!currentRoomIdRef.current && String(currentRoomIdRef.current) === String(roomId);

    setRooms((prev) =>
      prev.map((r) => {
        if (String(r._id) !== String(roomId)) return r;
        return {
          ...r,
          lastMessage: msg,
          members: r.members.map((m) => {
            const mId = getId((m as any).user);
            if (!mId || !isMe(mId)) return m;
            const nextUnread = isOpen || fromMe ? 0 : ((m as any).unreadCount || 0) + 1;
            return { ...m, unreadCount: nextUnread };
          }),
        };
      })
    );

    const hasMe = rooms.find((r) => String(r._id) === String(roomId))
      ?.members?.some((m) => isMe(getId((m as any).user)));
    if (!hasMe && !isOpen && !fromMe) {
      setClientUnread((prev) => ({ ...prev, [roomId]: (prev[roomId] ?? 0) + 1 }));
    }
  }, [rooms, isMe]);

  /* ===== Socket.IO – bind đúng 1 lần / mỗi socket ===== */
  const handleRoomMarkedAsRead = useCallback(({ chatroomId }: { chatroomId: string }) => {
    setRooms((prev) =>
      prev.map((r) =>
        String(r._id) === String(chatroomId)
          ? {
              ...r,
              members: r.members.map((m) => (isMe(getId((m as any).user)) ? { ...m, unreadCount: 0 } : m)),
            }
          : r
      )
    );
    setClientUnread((prev) => ({ ...prev, [chatroomId]: 0 }));
  }, [isMe]);

  const onRoomCreated = useCallback((room: TChatRoom) => {
    setRooms((prev) => upsertRooms(prev, normalizeRoom(room)));
  }, []);

  const onMembersAdded = useCallback((payload: any) => {
    const room: TChatRoom = normalizeRoom(payload?.room ?? payload);
    if (!room?._id) return;
    setRooms((prev) => upsertRooms(prev, room));
    setSelectedRoom((prevSel) => (prevSel && String(prevSel._id) === String(room._id) ? mergeRoom(prevSel, room) : prevSel));
  }, []);

  const onMemberRemoved = useCallback((payload: any) => {
    const room: TChatRoom = normalizeRoom(payload?.room ?? payload);
    if (!room?._id) return;
    setRooms((prev) => upsertRooms(prev, room));
    setSelectedRoom((prevSel) => {
      if (!prevSel || String(prevSel._id) !== String(room._id)) return prevSel;
      const merged = mergeRoom(prevSel, room);
      if (merged && merged.members.every((m) => !isMe(getId((m as any).user)))) return null;
      return merged;
    });
  }, [isMe]);

  const onRoomUpdated = useCallback((room: TChatRoom) => {
    const r = normalizeRoom(room);
    setRooms((prev) => upsertRooms(prev, r));
    setSelectedRoom((prevSel) => (prevSel && String(prevSel._id) === String(r._id) ? mergeRoom(prevSel, r) : prevSel));
  }, []);

  /** NEW: handler ổn định, luôn dedupe trước khi append */
  const onNewMessage = useCallback((message: TChatMessage) => {
    const roomId = getChatroomId(message);
    const inThisRoom = !!currentRoomIdRef.current && String(currentRoomIdRef.current) === String(roomId);

    if (inThisRoom) {
      setMessages((prev) => dedupeMessages([...prev, message]));
      setHeaderFlash(true);
      setTimeout(() => setHeaderFlash(false), 2200);
    }
    updateRoomsByIncoming(message);

    setRooms((prev) => {
      const exists = prev.some((r) => String(r._id) === String(roomId));
      if (!exists) fetchRooms();
      return prev;
    });
  }, [updateRoomsByIncoming, fetchRooms]);

  useEffect(() => {
    if (!chatSocket || listenersBoundRef.current) return;

    const handleConnect = () => {
      if (currentRoomIdRef.current) {
        chatSocket.emit('joinRoom', { chatroomId: currentRoomIdRef.current });
      }
    };

    // Trước khi bind, đảm bảo off hết cũ
    chatSocket.off('connect');
    chatSocket.off('newMessage');
    chatSocket.off('room_marked_as_read');
    chatSocket.off('room_created');
    chatSocket.off('room_members_added');
    chatSocket.off('room_member_removed');
    chatSocket.off('room_updated');

    chatSocket.on('connect', handleConnect);
    chatSocket.on('newMessage', onNewMessage);
    chatSocket.on('room_marked_as_read', handleRoomMarkedAsRead);
    chatSocket.on('room_created', onRoomCreated);
    chatSocket.on('room_members_added', onMembersAdded);
    chatSocket.on('room_member_removed', onMemberRemoved);
    chatSocket.on('room_updated', onRoomUpdated);

    listenersBoundRef.current = true;

    return () => {
      listenersBoundRef.current = false;
      chatSocket.off('connect', handleConnect);
      chatSocket.off('newMessage', onNewMessage);
      chatSocket.off('room_marked_as_read', handleRoomMarkedAsRead);
      chatSocket.off('room_created', onRoomCreated);
      chatSocket.off('room_members_added', onMembersAdded);
      chatSocket.off('room_member_removed', onMemberRemoved);
      chatSocket.off('room_updated', onRoomUpdated);
    };
  }, [chatSocket, onNewMessage, handleRoomMarkedAsRead, onRoomCreated, onMembersAdded, onMemberRemoved, onRoomUpdated]);

  /* ===== Tổng unread ===== */
  useEffect(() => {
    if (!myId) return;
    const total = rooms.reduce((sum, r) => {
      const mine = r.members.find((m) => isMe(getId((m as any).user)));
      const count = mine ? ((mine as any)?.unreadCount || 0) : (clientUnread[String(r._id)] || 0);
      return sum + count;
    }, 0);
    window.dispatchEvent(new CustomEvent('chat-unread-total', { detail: { total } }));
  }, [rooms, myId, clientUnread, isMe]);

  const totalUnread = useMemo(() => {
    if (!myId) return 0;
    return rooms.reduce((sum, r) => {
      const mine = r.members.find((m) => isMe(getId((m as any).user)));
      const count = mine ? ((mine as any)?.unreadCount || 0) : (clientUnread[String(r._id)] || 0);
      return sum + count;
    }, 0);
  }, [rooms, myId, clientUnread, isMe]);

  /* ===== Presence subscribe ===== */
  useEffect(() => {
    const ids: string[] = [];
    rooms.forEach(r => r.members.forEach(m => {
      const uid =
        (m as any)?.user?._id || (m as any)?.user?.id || (m as any)?._id || (m as any)?.id;
      if (uid) ids.push(String(uid));
    }));
    friends.forEach(f => f?.id && ids.push(String(f.id)));
    const me = (user as any)?._id || (user as any)?.id;
    const filtered = Array.from(new Set(ids.filter(x => String(x) !== String(me))));
    subscribePresence(filtered);
  }, [rooms, friends, user, subscribePresence]);

  /* ===== Chọn phòng ===== */
  const handleSelectRoom = useCallback(
    async (room: TChatRoom) => {
      if (chatSocket && currentRoomIdRef.current) {
        chatSocket.emit('typing_stop', { chatroomId: currentRoomIdRef.current, userId: String(myId || '') });
        chatSocket.emit('leaveRoom', { chatroomId: currentRoomIdRef.current });
      }
      setSelectedRoom(room);
      currentRoomIdRef.current = String(room._id);

      if (chatSocket) chatSocket.emit('joinRoom', { chatroomId: room._id });

      const response = await api.get(`/chat/rooms/${room._id}/messages`);
      const list: TChatMessage[] = Array.isArray(response.data) ? response.data : [];
      setMessages(dedupeMessages(list));

      if (chatSocket) {
        chatSocket.emit('mark_room_as_read', { chatroomId: room._id }, () => {
          setRooms((prev) =>
            prev.map((r) =>
              String(r._id) === String(room._id)
                ? {
                    ...r,
                    members: r.members.map((m) => (isMe(getId((m as any).user)) ? { ...m, unreadCount: 0 } : m)),
                  }
                : r
            )
          );
          setClientUnread((prev) => ({ ...prev, [String(room._id)]: 0 }));
        });
      } else {
        setClientUnread((prev) => ({ ...prev, [String(room._id)]: 0 }));
      }

      if (!room.isGroupChat) {
        const peer = room.members.find((m) => !isMe(getId((m as any).user)))?.user;
        const pid = getId(peer);
        if (pid) {
          try { setBlockStatus(await getBlockStatus(String(pid))); }
          catch { setBlockStatus(null); }
        } else setBlockStatus(null);
      } else setBlockStatus(null);

      setMenuOpen(false);
    },
    [chatSocket, isMe, myId]
  );

  useEffect(() => () => {
    if (chatSocket && currentRoomIdRef.current) {
      chatSocket.emit('typing_stop', { chatroomId: currentRoomIdRef.current, userId: String(myId || '') });
      chatSocket.emit('leaveRoom', { chatroomId: currentRoomIdRef.current });
    }
  }, [chatSocket, myId]);

  /* ===== Gửi tin nhắn ===== */
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatSocket || !selectedRoom) return;
    if (!selectedRoom.isGroupChat && blockStatus && (blockStatus.blockedByMe || blockStatus.blockedMe)) return;
    chatSocket.emit('sendMessage', { chatroomId: selectedRoom._id, content: newMessage.trim() });
    stopTyping();
    setNewMessage('');
  };

  /* ===== Create group / DM ===== */
  const openCreateModal = async () => {
    if (createBtnLockRef.current) return;
    createBtnLockRef.current = true;
    setMenuOpen(false);
    setOpenCreate(true);
    if (!friends.length) await fetchFriends();
    setTimeout(() => { createBtnLockRef.current = false; }, 300);
  };

  const openOrCreateDM = useCallback(
    async (friendId: string) => {
      try {
        const res = await api.post('/chat/rooms', { memberIds: [friendId] });
        const room: TChatRoom = normalizeRoom(res.data?.room ?? res.data);
        setRooms((prev) => (prev.some((r) => String(r._id) === String(room._id)) ? prev : [room, ...prev]));
        await handleSelectRoom(room);
      } catch (e) {
        console.error('openOrCreateDM error', e);
      }
    },
    [handleSelectRoom]
  );

  useEffect(() => {
    const handler = (e: WindowEventMap['open-dm']) => {
      const id = e?.detail?.userId;
      if (id) openOrCreateDM(id);
    };
    window.addEventListener('open-dm', handler);
    return () => window.removeEventListener('open-dm', handler);
  }, [openOrCreateDM]);

  const createGroup = async ({
    name,
    memberIds,
    avatarFile,
  }: { name: string; memberIds: string[]; avatarFile?: File | null }) => {
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

      const roomFromRes: TChatRoom = normalizeRoom(res.data?.room ?? res.data);
      if (roomFromRes?._id) {
        setRooms((prev) => (prev.some((r) => String(r._id) === String(roomFromRes._id)) ? prev : [roomFromRes, ...prev]));
        await handleSelectRoom(roomFromRes);
      }
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

  // ======= Presence helpers + dot CSS =======
  const isOnline = useCallback((uid?: any) => {
    if (!uid) return false;
    const s = presence[String(uid)];
    return !!s?.online;
  }, [presence]);

  const fmtLastSeen = (ts?: number) => {
    if (!ts) return 'Ngoại tuyến';
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Vừa hoạt động';
    if (m < 60) return `Hoạt động ${m} phút trước`;
    const h = Math.floor(m / 60);
    if (h < 24) return `Hoạt động ${h} giờ trước`;
    const d = Math.floor(h / 24);
    return `Hoạt động ${d} ngày trước`;
  };

  const dotCSS: React.CSSProperties = {
    position: 'absolute', right: -2, bottom: -2, width: 12, height: 12,
    borderRadius: '50%', background: '#3cc76a', border: '2px solid #1e1f24'
  };

  // ======= ✅ Tạo href hồ sơ (ưu tiên username, thiếu thì dùng id) =======
  const getPeerProfileHref = useCallback(() => {
    if (!selectedRoom || selectedRoom.isGroupChat) return '#';
    const peer: any = selectedRoom.members.find(
      (m: any) => String(getId(m?.user)) !== String(getMyIdFromAuth(user))
    )?.user;
    if (!peer) return '#';
    const username: string | undefined = peer?.username;
    const pid = getId(peer);
    return username
      ? `/profile/${encodeURIComponent(username)}`
      : (pid ? `/profile/${pid}` : '#');
  }, [selectedRoom, user]);

  const navigateToPeerProfile = useCallback(() => {
    const href = getPeerProfileHref();
    if (href && href !== '#') navigate(href);
  }, [getPeerProfileHref, navigate]);

  const menuItems = (() => {
    if (!selectedRoom) return [] as { key: string; label: string; danger?: boolean; disabled?: boolean; onClick: () => void | Promise<void> }[];
    if (isGroup) {
      return [
        { key: 'settings', label: 'Cài đặt nhóm', onClick: async () => { setOpenCreate(false); await fetchFriends(); setOpenSettings(true); } },
        { key: 'add-members', label: 'Thêm thành viên', onClick: async () => { setOpenCreate(false); await fetchFriends(); setOpenSettings(true); } },
        {
          key: 'leave', label: 'Rời nhóm', danger: true,
          onClick: async () => {
            if (!selectedRoom) return;
            const ok = window.confirm('Bạn có chắc muốn rời nhóm này?');
            if (!ok) return;
            try {
              await leaveRoom(String(selectedRoom._id), String(myId || ''));
              setSelectedRoom(null);
              await fetchRooms();
            } catch (e) {
              console.error('Leave group failed', e);
              alert('Rời nhóm thất bại. Vui lòng thử lại.');
            }
          },
        },
      ];
    } else {
      const peer = selectedRoom ? getPeer(selectedRoom) : undefined;
      return [
        { key: 'profile', label: 'Xem hồ sơ', onClick: () => {} },
        {
          key: 'toggle-block',
          label: blockStatus?.blockedByMe ? 'Bỏ chặn người này' : (blockStatus?.blockedMe ? 'Bạn bị chặn' : 'Chặn người này'),
          danger: !blockStatus?.blockedByMe && !blockStatus?.blockedMe,
          disabled: !!blockStatus?.blockedMe && !blockStatus?.blockedByMe,
          onClick: async () => {
            const pid = getId(peer);
            if (!pid) return;
            try {
              const st = await getBlockStatus(String(pid));
              if (st.blockedByMe) await unblockUser(String(pid));
              else await blockUser(String(pid));
              setBlockStatus(await getBlockStatus(String(pid)));
            } catch (e) { console.error('toggle block failed', e); }
          },
        },
      ];
    }
  })();

  return (
    <div className="chat-page-layout">
      <div className="sidebar">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          Tin nhắn
          <UnreadBadge count={totalUnread} size="md" />
        </h2>
        <div style={{ padding: 12 }}>
          <button className="btn btn-primary w-100" onClick={openCreateModal}>
            + Tạo nhóm
          </button>
        </div>

        <div className="room-list">
          {rooms.map((room) => {
            const details = getRoomDetails(room);
            const mine = room.members.find((m) => isMe(getId((m as any).user)));
            const unread = mine ? ((mine as any)?.unreadCount || 0) : (clientUnread[String(room._id)] || 0);
            const active = selectedRoom?._id && String(selectedRoom._id) === String(room._id);

            // Group: online if any member (not me) online
            const groupOnline = room.isGroupChat
              ? room.members.some((m) => {
                  const uid =
                    (m as any)?.user?._id || (m as any)?.user?.id || (m as any)?._id || (m as any)?.id;
                  return uid && !isMe(uid) && isOnline(uid);
                })
              : false;

            // DM: online if peer online
            const peer = !room.isGroupChat
              ? room.members.find((m) => !isMe(getId((m as any).user)))?.user
              : null;
            const peerOnline = peer ? isOnline(getId(peer)) : false;

            return (
              <div
                key={String(room._id)}
                className={`room-item ${active ? 'active' : ''}`}
                onClick={() => handleSelectRoom(room)}
              >
                <div style={{ position: 'relative' }}>
                  <img
                    src={details.avatar}
                    alt={details.name}
                    className="room-avatar"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = room.isGroupChat ? '/images/default-group.png' : '/images/default-user.png'; }}
                  />
                  {(room.isGroupChat ? groupOnline : peerOnline) ? <span style={dotCSS} /> : null}
                </div>
                <div className="room-info">
                  <div className="room-top">
                    <span className="room-name">{details.name}</span>
                    <UnreadBadge count={unread} size="sm" />
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
              {/* Avatar + presence */}
              <div
                className="peer"
                onClick={() => { if (!isGroup) navigateToPeerProfile(); }}
                style={{ cursor: isGroup ? 'default' : 'pointer' }}
              >
                <div style={{ position: 'relative' }}>
                  <img
                    className="peer-avatar"
                    src={headerInfo?.avatar || '/images/default-group.png'}
                    alt={headerInfo?.name || ''}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/default-group.png'; }}
                  />
                  {(() => {
                    if (isGroup) {
                      const onlineCount = selectedRoom.members.reduce((acc, m) => {
                        const uid =
                          (m as any)?.user?._id || (m as any)?.user?.id || (m as any)?._id || (m as any)?.id;
                        return acc + (uid && !isMe(uid) && isOnline(uid) ? 1 : 0);
                      }, 0);
                      return onlineCount > 0 ? <span style={dotCSS} /> : null;
                    } else {
                      const peer = selectedRoom.members.find((m) => !isMe(getId((m as any).user)))?.user;
                      return peer && isOnline(getId(peer)) ? <span style={dotCSS} /> : null;
                    }
                  })()}
                </div>

                <div className="peer-meta">
                  <h3 className="peer-name">
                    {headerInfo?.name}
                    {headerFlash && <span className="chat-header-flash">Tin mới</span>}
                  </h3>
                  <small className="peer-sub">
                    {isGroup
                      ? (() => {
                          const onlineCount = selectedRoom.members.reduce((acc, m) => {
                            const uid =
                              (m as any)?.user?._id || (m as any)?.user?.id || (m as any)?._id || (m as any)?.id;
                            return acc + (uid && !isMe(uid) && isOnline(uid) ? 1 : 0);
                          }, 0);
                          return onlineCount > 0
                            ? `${onlineCount} người đang hoạt động`
                            : `${selectedRoom.members.length} thành viên`;
                        })()
                      : (() => {
                          const peer = selectedRoom.members.find((m) => !isMe(getId((m as any).user)))?.user;
                          const pid = getId(peer);
                          if (!pid) return 'Trò chuyện';
                          return isOnline(pid) ? 'Đang hoạt động' : fmtLastSeen(presence[pid]?.lastSeen);
                        })()
                    }
                  </small>
                </div>
              </div>

              <div className="chat-actions">
                <button
                  ref={menuBtnRef}
                  className="fab-btn header-kebab"
                  title={isGroup ? 'Tùy chọn nhóm' : (blockStatus?.blockedByMe ? 'Bỏ chặn' : 'Tùy chọn')}
                  onClick={() => {
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
                  >
                    {menuItems.map((it) => {
                      if (it.key === 'profile') {
                        const href = getPeerProfileHref();
                        const disabled = href === '#';
                        return (
                          <a
                            key={it.key}
                            href={href}
                            role="menuitem"
                            className={`kebab-menu__item ${disabled ? 'is-disabled' : ''}`}
                            onClick={(e) => {
                              if (disabled) { e.preventDefault(); return; }
                              setMenuOpen(false);
                            }}
                          >
                            {it.label}
                          </a>
                        );
                      }

                      const disabled = !!it.disabled;
                      return (
                        <button
                          key={it.key}
                          type="button"
                          role="menuitem"
                          className={`kebab-menu__item ${it.danger ? 'is-danger' : ''} ${disabled ? 'is-disabled' : ''}`}
                          disabled={disabled}
                          onClick={async () => {
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

            {!isGroup && blockStatus && (blockStatus.blockedByMe || blockStatus.blockedMe) && (
              <div className="block-banner">
                {blockStatus.blockedByMe
                  ? 'Bạn đã chặn người này. Hãy bỏ chặn để tiếp tục trò chuyện.'
                  : 'Người này đã chặn bạn. Bạn không thể nhắn tin.'}
              </div>
            )}

            <div className="messages-container" ref={messagesContainerRef}>
              {messages.map((msg) => {
                const key = msgKey(msg);
                return <ChatMessageComponent key={key} message={msg} />;
              })}
            </div>

            {/* ✅ Hiển thị người đang nhập */}
            <TypingIndicator typers={typers} />

            <form className="message-input-area" onSubmit={handleSendMessage}>
              <input
                type="text"
                placeholder={!isGroup && blockStatus && (blockStatus.blockedByMe || blockStatus.blockedMe)
                  ? 'Không thể nhắn do đang bị chặn'
                  : 'Nhập tin nhắn...'}
                value={newMessage}
                onChange={(e) => { setNewMessage(e.target.value); onType(); }}
                onKeyDown={onType}
                onBlur={stopTyping}
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
          meId={String(myId)}
          room={selectedRoom}
          friends={friends}
          onClose={() => setOpenSettings(false)}
          onUpdated={(room) => {
            const r = normalizeRoom(room);
            setRooms(prev => upsertRooms(prev, r));
            setSelectedRoom(prevSel => (prevSel && String(prevSel._id) === String(r._id) ? mergeRoom(prevSel, r) : prevSel));
          }}
        />
      )}
    </div>
  );
};

export default ChatPage;
