// File: src/hooks/usePresence.ts
import { useCallback, useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';

export type PresenceMap = Record<string, { online: boolean; lastSeen?: number }>;

export function usePresence(socket: Socket | null) {
  const [presence, setPresence] = useState<PresenceMap>({});

  useEffect(() => {
    if (!socket) return;
    const onUpdate = (p: { userId: string; online: boolean; lastSeen?: number }) => {
      const uid = String(p.userId);
      setPresence(prev => ({ ...prev, [uid]: { online: p.online, lastSeen: p.lastSeen } }));
    };
    const onSnapshot = (payload: { users: PresenceMap }) => {
      if (!payload?.users) return;
      const normalized: PresenceMap = {};
      Object.entries(payload.users).forEach(([k, v]) => { normalized[String(k)] = v; });
      setPresence(prev => ({ ...prev, ...normalized }));
    };

    socket.on('presence_update', onUpdate);
    socket.on('presence_snapshot', onSnapshot);
    return () => {
      socket.off('presence_update', onUpdate);
      socket.off('presence_snapshot', onSnapshot);
    };
  }, [socket]);

  const subscribePresence = useCallback((userIds: (string | number | null | undefined)[]) => {
    if (!socket) return;
    const ids = Array.from(new Set(userIds.filter(Boolean).map((x) => String(x))));
    if (!ids.length) return;
    socket.emit('presence_subscribe', { userIds: ids });
  }, [socket]);

  return { presence, subscribePresence };
}
