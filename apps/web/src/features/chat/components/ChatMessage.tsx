import React from "react";
import type { ChatMessage } from "../types/Chat";
import { useAuth } from "../../auth/AuthContext";
import "./ChatMessage.scss";
import { publicUrl } from "../../../untils/publicUrl";

interface ChatMessageProps {
  message: ChatMessage | (Omit<ChatMessage, "chatroom"> & { chatroom?: string });
}

const toPublic = (s?: string | null) => (s ? publicUrl(s) : undefined);

const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message }) => {
  const { user } = useAuth();

  const myId = (user as any)?._id || (user as any)?.id;
  const senderId = (message.sender as any)?._id || (message.sender as any)?.id;
  const isSentByMe = !!myId && !!senderId && String(myId) === String(senderId);

  const senderAvatarRaw =
    message.sender?.profile?.avatarUrl ??
    (message.sender as any)?.avatarUrl ??
    (message.sender as any)?.avatar ??
    (message.sender as any)?.imageUrl ??
    (message.sender as any)?.photo ??
    (message.sender as any)?.picture ??
    null;

  const avatarSrc =
    toPublic(senderAvatarRaw) || "https://placehold.co/28x28/2a2a2a/ffffff?text=U";

  const senderName =
    (message.sender as any)?.username ||
    (message.sender as any)?.name ||
    (message.sender as any)?.displayName ||
    "Người dùng";

  return (
    <div className={`chat-message-wrapper ${isSentByMe ? "sent" : "received"}`}>
      {!isSentByMe && (
        <img
          src={avatarSrc}
          alt={senderName}
          className="avatar"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "https://placehold.co/28x28/2a2a2a/ffffff?text=U";
          }}
        />
      )}

      <div className="message-bubble">
        {!isSentByMe && <strong className="sender-name">{senderName}</strong>}
        <p className="message-content">{(message as any)?.content ?? ""}</p>
        <span className="timestamp">
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
};

export default ChatMessageComponent;
