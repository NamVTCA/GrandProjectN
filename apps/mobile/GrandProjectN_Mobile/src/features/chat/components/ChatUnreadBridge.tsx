import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { useSocket } from "../../../hooks/useSocket";
import api from "../../../services/api";

const getId = (x: any): string | null => {
  if (!x) return null;
  if (typeof x === "string" || typeof x === "number") return String(x);
  if (typeof x === "object") {
    if (x._id) return String(x._id);
    if (x.id) return String(x.id);
  }
  return null;
};

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

const debounce = <F extends (...args: any[]) => void>(fn: F, ms = 150) => {
  let t: any;
  return (...args: Parameters<F>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

const ChatUnreadBridge: React.FC = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const listenersBoundRef = useRef(false);

  const myId = useMemo(() => {
    const raw = user ?? (user as any)?.user;
    return getId(raw) ?? (user as any)?.userId ?? null;
  }, [user]);

  const [rooms, setRooms] = useState<Room[]>([]);
  const joinedRoomsRef = useRef<Set<string>>(new Set());

  const fetchRooms = useCallback(async () => {
    try {
      const res = await api.get("/chat/rooms");
      const data = Array.isArray(res.data) ? res.data : (res.data?.items ?? []);
      const normalized = data.map(normalizeRoom);
      setRooms(normalized);
      return normalized;
    } catch (e) {
      console.error("ChatUnreadBridge: load rooms fail", e);
      return [] as Room[];
    }
  }, []);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

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

  useEffect(() => { if (rooms.length) joinAllRooms(rooms); }, [rooms, joinAllRooms]);

  useEffect(() => {
    if (!socket) return;
    const onConnect = async () => {
      joinedRoomsRef.current.clear();
      const current = rooms.length ? rooms : await fetchRooms();
      joinAllRooms(current);
    };
    socket.on?.("connect", onConnect);
    return () => { socket.off?.("connect", onConnect); };
  }, [socket, joinAllRooms, fetchRooms, rooms.length]);

  const broadcastTotal = useCallback((roomsNow: Room[]) => {
    if (!myId) return;
    const total = roomsNow.reduce((sum, r) => {
      const mine = r.members.find(
        (m) => String(getId((m as any).user)) === String(myId)
      );
      return sum + (mine?.unreadCount || 0);
    }, 0);
    
    // In React Native, we might use a different event system
    // For now, we'll use a simple callback or context
    console.log("Total unread messages:", total);
  }, [myId]);

  useEffect(() => { broadcastTotal(rooms); }, [rooms, broadcastTotal]);

  const refreshRoomsLight = useCallback(async () => {
    const list = await fetchRooms();
    joinAllRooms(list);
  }, [fetchRooms, joinAllRooms]);

  const scheduleRefresh = useMemo(
    () => debounce(() => { refreshRoomsLight(); }, 150),
    [refreshRoomsLight]
  );

  const onNewMessage = useCallback((message: any) => {
    const senderId = getId(message?.sender);
    if (senderId && myId && String(senderId) === String(myId)) return;
    scheduleRefresh();
  }, [myId, scheduleRefresh]);

  const onRoomMarkedAsRead = useCallback(() => {
    scheduleRefresh();
  }, [scheduleRefresh]);

  useEffect(() => {
    if (!socket || listenersBoundRef.current) return;

    socket.off("newMessage");
    socket.off("room_marked_as_read");
    socket.off("room_created");
    socket.off("room_updated");
    socket.off("room_members_added");
    socket.off("room_member_removed");
    socket.off("room_deleted");

    socket.on("newMessage", onNewMessage);
    socket.on("room_marked_as_read", onRoomMarkedAsRead);
    socket.on("room_created", scheduleRefresh);
    socket.on("room_updated", scheduleRefresh);
    socket.on("room_members_added", scheduleRefresh);
    socket.on("room_member_removed", scheduleRefresh);
    socket.on("room_deleted", scheduleRefresh);

    listenersBoundRef.current = true;

    return () => {
      listenersBoundRef.current = false;
      socket.off("newMessage", onNewMessage);
      socket.off("room_marked_as_read", onRoomMarkedAsRead);
      socket.off("room_created", scheduleRefresh);
      socket.off("room_updated", scheduleRefresh);
      socket.off("room_members_added", scheduleRefresh);
      socket.off("room_member_removed", scheduleRefresh);
      socket.off("room_deleted", scheduleRefresh);
    };
  }, [socket, onNewMessage, onRoomMarkedAsRead, scheduleRefresh]);

  return null;
};

export default ChatUnreadBridge;