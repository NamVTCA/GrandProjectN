export interface ChatParticipant {
  _id: string;
  username: string;
  avatar?: string;
}

// Define the structure for a single chat message
export interface ChatMessage {
  _id: string;
  sender: ChatParticipant;
  chatroom: string; // ID of the chatroom
  content: string;
  createdAt: string;
}

// Define the structure for a single chat room in the list
export interface ChatRoom {
  _id: string;
  name?: string; // For group chats
  isGroupChat: boolean;
  members: {
    user: ChatParticipant;
    unreadCount?: number;
  }[];
  lastMessage?: ChatMessage; // The last message sent in the room
}