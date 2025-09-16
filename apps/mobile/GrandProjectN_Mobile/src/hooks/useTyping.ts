import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';

export type TypingUser = { id: string; username: string };

type Args = {
  socket: Socket | null;
  roomId: string | null | undefined;
  me: { id: string; username: string };
};

const PING_EVERY_MS = 1500; // throttle

export function useTyping({ socket, roomId, me }: Args) {
  const [typers, setTypers] = useState<TypingUser[]>([]);
  const lastPingAtRef = useRef(0);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lắng nghe danh sách đang nhập
  useEffect(() => {
    if (!socket) return;

    const onList = (payload: { chatroomId: string | number; typers?: TypingUser[] } | any) => {
      if (roomId == null) return;
      if (!payload || String(payload.chatroomId) !== String(roomId)) return;
      const arr: TypingUser[] = (payload.typers ?? []).filter(
        (u: TypingUser) => String(u.id) !== String(me.id)
      );
      setTypers(arr);
    };

    socket.on('typing_list', onList);

    // Cleanup: KHÔNG được return Socket — chỉ gọi và kết thúc
    return () => {
      socket.off('typing_list', onList);
    };
  }, [socket, roomId, me.id]);

  const onType = useCallback(() => {
    if (!socket || !roomId) return;

    const now = Date.now();
    if (now - lastPingAtRef.current < PING_EVERY_MS) return;

    lastPingAtRef.current = now;
    socket.emit('typing_ping', { chatroomId: roomId, user: me });

    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    stopTimerRef.current = setTimeout(() => {
      socket.emit('typing_stop', { chatroomId: roomId, userId: me.id });
      stopTimerRef.current = null;
    }, PING_EVERY_MS + 200);
  }, [socket, roomId, me]);

  const stopTyping = useCallback(() => {
    if (!socket || !roomId) return;
    socket.emit('typing_stop', { chatroomId: roomId, userId: me.id });
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
  }, [socket, roomId, me.id]);

  // Dọn timer khi đổi phòng / unmount
  useEffect(() => {
    return () => {
      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current);
        stopTimerRef.current = null;
      }
    };
  }, [roomId, socket]);

  return { typers, onType, stopTyping };
}
