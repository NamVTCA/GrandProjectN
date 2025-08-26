// src/features/chat/ChatUnreadBridge.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { useSocket } from "../../../hooks/useSocket";
import api from "../../../services/api";


/** ===== Helpers ngắn gọn ===== */
const getId = (x: any): string | null => {
  if (!x) return null;
  if (typeof x === "string" || typeof x === "number") return String(x);
  if (typeof x === "object") {
    if (x._id) return String(x._id);
    if (x.id) return String(x.id);
  }
  return null;
};
const getChatroomId = (msg: any): string | null =>
  getId(msg?.chatroom ?? msg?.room ?? msg?.chatRoom ?? msg?.conversation);

type Member = { user: any; unreadCount?: number };
type Room = { _id: string; members: Member[]; isGroupChat?: boolean };

const normalizeRoom = (room: any): Room => {
  const members: Member[] = (room?.members || []).map((m: any) => {
    const u = m?.user ?? m?.userId ?? m;
    const user = typeof u === "string" || typeof u === "number" ? { _id: String(u) } : (u || {});
    return { user, unreadCount: m?.unreadCount || 0 };
  });
  return { _id: String(room?._id ?? room?.id), members, isGroupChat: !!room?.isGroupChat };
};

export default function ChatUnreadBridge() {
  const { user } = useAuth();
  const socket = useSocket(); // phải là provider toàn cục (mount ở App/MainLayout)
  const listenersBoundRef = useRef(false);

  const myId = useMemo(() => {
    const raw = user ?? (user as any)?.user;
    return getId(raw) ?? (user as any)?.userId ?? null;
  }, [user]);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [clientUnread, setClientUnread] = useState<Record<string, number>>({});
  const joinedRoomsRef = useRef<Set<string>>(new Set());

  /** Tải danh sách phòng của tôi */
  const fetchRooms = useCallback(async () => {
    try {
      const res = await api.get("/chat/rooms");
      const data = Array.isArray(res.data) ? res.data : (res.data?.items ?? []);
      const normalized = data.map(normalizeRoom);
      setRooms(normalized);
      return normalized;
    } catch (e) {
      console.error("ChatUnreadBridge: load rooms fail", e);
      return [];
    }
  }, []);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  /** ===== Join tất cả phòng để nhận newMessage khi ở trang bất kỳ ===== */
  const joinAllRooms = useCallback((list: Room[]) => {
    if (!socket) return;
    const joined = joinedRoomsRef.current;
    for (const r of list) {
      const rid = String(r._id);
      if (!joined.has(rid)) {
        socket.emit("joinRoom", { chatroomId: rid });
        joined.add(rid);
      }
    }
  }, [socket]);

  /** Khi socket connect/reconnect → join lại toàn bộ phòng */
  useEffect(() => {
    if (!socket) return;
    const onConnect = async () => {
      joinedRoomsRef.current.clear();
      const current = rooms.length ? rooms : await fetchRooms();
      joinAllRooms(current);
    };
    socket.on?.("connect", onConnect);
    return () => { socket.off?.("connect", onConnect); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, joinAllRooms, fetchRooms, rooms.length]);

  /** Khi danh sách phòng thay đổi (được fetch mới) → join phòng mới */
  useEffect(() => { if (rooms.length) joinAllRooms(rooms); }, [rooms, joinAllRooms]);

  /** ===== Tính tổng và bắn event cho Sidebar ===== */
  const isMe = useCallback((uid?: any) => !!uid && !!myId && String(uid) === String(myId), [myId]);

  const broadcastTotal = useCallback((roomsNow: Room[], clientUnreadNow: Record<string, number>) => {
    if (!myId) return;
    const total = roomsNow.reduce((sum, r) => {
      const mine = r.members.find((m) => isMe(getId((m as any).user)));
      const cnt = mine ? (mine.unreadCount || 0) : (clientUnreadNow[r._id] || 0);
      return sum + cnt;
    }, 0);
    window.dispatchEvent(new CustomEvent("chat-unread-total", { detail: { total } }));
  }, [myId, isMe]);

  useEffect(() => { broadcastTotal(rooms, clientUnread); }, [rooms, clientUnread, broadcastTotal]);

  /** ===== Handlers realtime ===== */
  const onNewMessage = useCallback((message: any) => {
    const roomId = getChatroomId(message);
    if (!roomId) return;

    // Tăng số chưa đọc của tôi cho phòng đó (reset sẽ do ChatPage -> mark_room_as_read)
    setRooms((prev) =>
      prev.map((r) => {
        if (String(r._id) !== String(roomId)) return r;
        return {
          ...r,
          members: r.members.map((m) => {
            const uid = getId((m as any).user);
            if (!isMe(uid)) return m;
            return { ...m, unreadCount: (m.unreadCount || 0) + 1 };
          }),
        };
      })
    );

    // Fallback nếu backend không có "me" trong members
    setClientUnread((p) => ({ ...p, [roomId]: (p[roomId] ?? 0) + 1 }));
  }, [isMe]);

  const onRoomMarkedAsRead = useCallback(({ chatroomId }: { chatroomId: string }) => {
    setRooms((prev) =>
      prev.map((r) =>
        String(r._id) === String(chatroomId)
          ? { ...r, members: r.members.map((m) => (isMe(getId((m as any).user)) ? { ...m, unreadCount: 0 } : m)) }
          : r
      )
    );
    setClientUnread((p) => ({ ...p, [chatroomId]: 0 }));
  }, [isMe]);

  const refreshRoomsLight = useCallback(async () => {
    const list = await fetchRooms();
    joinAllRooms(list);
  }, [fetchRooms, joinAllRooms]);

  /** Bind sự kiện socket đúng 1 lần (toàn cục) */
  useEffect(() => {
    if (!socket || listenersBoundRef.current) return;

    // clear trước (hot-reload)
    socket.off("newMessage");
    socket.off("room_marked_as_read");
    socket.off("room_created");
    socket.off("room_updated");
    socket.off("room_members_added");
    socket.off("room_member_removed");

    socket.on("newMessage", onNewMessage);
    socket.on("room_marked_as_read", onRoomMarkedAsRead);
    socket.on("room_created", refreshRoomsLight);
    socket.on("room_updated", refreshRoomsLight);
    socket.on("room_members_added", refreshRoomsLight);
    socket.on("room_member_removed", refreshRoomsLight);

    listenersBoundRef.current = true;

    return () => {
      listenersBoundRef.current = false;
      socket.off("newMessage", onNewMessage);
      socket.off("room_marked_as_read", onRoomMarkedAsRead);
      socket.off("room_created", refreshRoomsLight);
      socket.off("room_updated", refreshRoomsLight);
      socket.off("room_members_added", refreshRoomsLight);
      socket.off("room_member_removed", refreshRoomsLight);
    };
  }, [socket, onNewMessage, onRoomMarkedAsRead, refreshRoomsLight]);

  return null; // component nền, không render gì
}
