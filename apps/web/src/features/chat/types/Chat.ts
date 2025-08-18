// Một người tham gia chat
export interface ChatParticipant {
  _id: string;
  username: string;
  avatar?: string | null;

  // 👇 thêm cho an toàn, vì backend có thể trả các key này
  profile?: {
    avatarUrl?: string | null;
  } | null;

  imageUrl?: string | null;
  photo?: string | null;
  picture?: string | null;
}

// Tin nhắn trong phòng chat
export interface ChatMessage {
  _id: string;
  sender: ChatParticipant;
  chatroom: string; // ID của chatroom
  content: string;
  createdAt: string;
}

// Một phòng chat trong danh sách
export interface ChatRoom {
  _id: string;
  name?: string; // tên nhóm
  isGroupChat: boolean;

  members: {
    user: ChatParticipant;
    unreadCount?: number;
  }[];

  lastMessage?: ChatMessage;

  // 👇 thêm field cho group avatar
  avatarUrl?: string | null;
  avatar?: string | null;
}
