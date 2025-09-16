export type UserLite = {
  _id: string;
  username?: string;
  fullName?: string;
  avatar?: string;
};

export type Room = {
  _id: string;
  isGroupChat: boolean;
  name?: string;
  avatar?: string;
  members?: Array<UserLite | string>;
  lastMessage?: any;
  peer?: UserLite; // optional server hint
};

export const decorateRoom = (
  room: Room,
  myId: string,
  fallbackPeer?: UserLite
) => {
  let peer: UserLite | undefined = room.peer;

  if (!peer && !room.isGroupChat) {
    const arr = room.members || [];
    const raw = arr.find(
      (m: any) => String((m as any)._id ?? m) !== String(myId)
    );
    if (raw && typeof raw === 'object') peer = raw as UserLite;
    if (!peer && fallbackPeer) peer = fallbackPeer;
  }

  const title = room.isGroupChat
    ? (room.name || 'Nhóm')
    : (peer?.fullName || peer?.username || 'Người dùng');

  const ava = room.isGroupChat ? room.avatar : peer?.avatar;

  return { ...room, ui: { title, avatar: ava, peer } };
};
