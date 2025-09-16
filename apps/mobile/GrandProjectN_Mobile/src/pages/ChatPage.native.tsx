import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Modal,
  Image,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import api from '../services/api';
import { useSocket } from '../hooks/useSocket';
import type {
  ChatRoom as TChatRoom,
  ChatMessage as TChatMessage,
  ChatParticipant as TChatParticipant,
} from '../features/chat/types/chat';
import { useAuth } from '../features/auth/AuthContext';
import { publicUrl } from '../untils/publicUrl';
import type { PickableUser } from '../features/chat/components/CreateGroupModal';
import CreateGroupModal from '../features/chat/components/CreateGroupModal';
import GroupSettingsModal from '../features/chat/components/GroupSettingsModal';
import { blockUser, unblockUser, getBlockStatus } from '../services/user';
import { leaveRoom, deleteRoomAsOwner } from '../services/chat';
import UnreadBadge from '../features/chat/components/UnreadBadge';
import TypingIndicator from '../features/chat/components/TypingIndicator';
import { useTyping } from '../hooks/useTyping';
import { usePresence } from '../hooks/usePresence';
import SafeImg from '../components/SafeImg';
import VoiceDock from '../components/voice/VoiceDock';

const Stack = createStackNavigator();

const GROUP_FALLBACK = '../images/default-group.png';
const USER_FALLBACK = '../images/default-user.png';

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

const normalizeRoom = (room: any): TChatRoom => {
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

  const createdBy = room?.createdBy
    ? (typeof room.createdBy === 'object'
        ? { _id: String(room.createdBy._id || room.createdBy.id || room.createdBy) }
        : { _id: String(room.createdBy) })
    : undefined;

  return {
    ...room,
    createdBy,
    avatarUrl: avatarRaw ? publicUrl(avatarRaw) : undefined,
    members: normMembers,
  } as TChatRoom;
};

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const chatSocket = useSocket();
  const navigation = useNavigation();

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerFlash, setHeaderFlash] = useState(false);
  const [showVoice, setShowVoice] = useState(false);

  const myId = getMyIdFromAuth(user);
  const meUsername = (user as any)?.username || (user as any)?.name || 'Bạn';
  const isMe = (uid?: any) => !!uid && !!myId && String(uid) === String(myId);

  const { typers, onType, stopTyping } = useTyping({
    socket: chatSocket,
    roomId: selectedRoom?._id,
    me: { id: String(myId || ''), username: meUsername },
  });

  const { presence, subscribePresence } = usePresence(chatSocket);

  const fetchRooms = useCallback(async () => {
    try {
      setLoadingRooms(true);
      const res = await api.get('/chat/rooms');
      const normalized = (res.data || []).map(normalizeRoom);
      setRooms(normalized);
      return normalized as TChatRoom[];
    } catch (e) {
      console.error('Load rooms failed', e);
      return [];
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  const fetchFriends = useCallback(async () => {
    if (loadingFriends) return;
    setLoadingFriends(true);
    try {
      let data: any = null;
      try {
        data = (await api.get('/friends/me')).data;
      } catch {}
      if (!data) data = (await api.get('/friends')).data;

      const raw: any[] = (data?.friends ?? data?.friendList ?? data?.items ?? data ?? []) as any[];
      const mapped: PickableUser[] = raw.flatMap((it: any) => {
        const c =
          it?.user ??
          it?.friend ??
          it?.friendUser ??
          it?.target ??
          it?.receiver ??
          it?.to ??
          it?.toUser ??
          it?.from ??
          it?.requester ??
          it?.sender ??
          it;
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

  useEffect(() => {
    fetchRooms();
    fetchFriends();
  }, [fetchRooms, fetchFriends]);

  const handleSelectRoom = useCallback(
    async (room: TChatRoom) => {
      setSelectedRoom(room);

      const response = await api.get(`/chat/rooms/${room._id}/messages`);
      const list: TChatMessage[] = Array.isArray(response.data) ? response.data : [];
      setMessages(list);

      if (!room.isGroupChat) {
        const peer = room.members.find((m) => !isMe(getId((m as any).user)))?.user;
        const pid = getId(peer);
        if (pid) {
          try {
            setBlockStatus(await getBlockStatus(String(pid)));
          } catch {
            setBlockStatus(null);
          }
        } else setBlockStatus(null);
      } else setBlockStatus(null);

      setMenuOpen(false);
    },
    [isMe]
  );

  const handleSendMessage = () => {
    if (!newMessage.trim() || !chatSocket || !selectedRoom) return;
    if (!selectedRoom.isGroupChat && blockStatus && (blockStatus.blockedByMe || blockStatus.blockedMe)) return;
    chatSocket.emit('sendMessage', { chatroomId: selectedRoom._id, content: newMessage.trim() });
    stopTyping();
    setNewMessage('');
  };

  const getRoomDetails = (room: TChatRoom) => {
    if (room.isGroupChat) {
      const raw = room.avatarUrl || room.avatar;
      return {
        name: room.name || 'Nhóm chat',
        avatar: raw ? publicUrl(raw) : GROUP_FALLBACK,
      };
    }
    const other = room.members.find((m) => !isMe(getId((m as any).user)))?.user;
    const raw =
      (other as any)?.avatarUrl ||
      (other as any)?.profile?.avatarUrl ||
      (other as any)?.avatar ||
      (other as any)?.imageUrl ||
      (other as any)?.photo ||
      (other as any)?.picture ||
      '';
    const name = (other as any)?.fullName || (other as any)?.username || 'Người dùng';
    return { name, avatar: raw ? publicUrl(raw) : USER_FALLBACK };
  };

  const renderRoomItem = ({ item }: { item: TChatRoom }) => {
    const details = getRoomDetails(item);
    const mine = item.members.find((m) => isMe(getId((m as any).user)));
    const unread = mine ? ((mine as any)?.unreadCount || 0) : 0;
    const active = selectedRoom?._id && String(selectedRoom._id) === String(item._id);

    return (
      <TouchableOpacity
        style={[styles.roomItem, active && styles.activeRoomItem]}
        onPress={() => handleSelectRoom(item)}
      >
        <Image source={{ uri: details.avatar }} style={styles.roomAvatar} />
        <View style={styles.roomInfo}>
          <View style={styles.roomTop}>
            <Text style={styles.roomName}>{details.name}</Text>
            {unread > 0 && <UnreadBadge count={unread} size="sm" />}
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage?.content}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMessage = ({ item }: { item: TChatMessage }) => {
    return (
      <View style={styles.messageContainer}>
        <Image source={{ uri: (item.sender as any)?.avatarUrl }} style={styles.messageAvatar} />
        <View style={styles.messageContent}>
          <Text style={styles.senderName}>{(item.sender as any)?.username}</Text>
          <Text style={styles.messageText}>{item.content}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.layout}>
        <View style={styles.sidebar}>
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarTitle}>Tin nhắn</Text>
            <UnreadBadge
              count={rooms.reduce(
                (sum, r) =>
                  sum +
                  (r.members.find((m) => isMe(getId((m as any).user)))?.unreadCount || 0),
                0
              )}
              size="md"
            />
          </View>
          <TouchableOpacity style={styles.createButton} onPress={() => setOpenCreate(true)}>
            <Text style={styles.createButtonText}>+ Tạo nhóm</Text>
          </TouchableOpacity>
          <FlatList
            data={rooms}
            renderItem={renderRoomItem}
            keyExtractor={(item) => String(item._id)}
            style={styles.roomList}
          />
        </View>

        <View style={styles.mainChatArea}>
          {selectedRoom ? (
            <>
              <View style={styles.chatHeader}>
                <TouchableOpacity style={styles.peerInfo} onPress={() => {}}>
                  <Image
                    source={{ uri: getRoomDetails(selectedRoom).avatar }}
                    style={styles.peerAvatar}
                  />
                  <View style={styles.peerMeta}>
                    <Text style={styles.peerName}>{getRoomDetails(selectedRoom).name}</Text>
                    <Text style={styles.peerStatus}>
                      {selectedRoom.isGroupChat
                        ? `${selectedRoom.members.length} thành viên`
                        : 'Đang hoạt động'}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setMenuOpen(!menuOpen)}>
                  <Icon name="more-vert" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              {!selectedRoom.isGroupChat &&
                blockStatus &&
                (blockStatus.blockedByMe || blockStatus.blockedMe) && (
                  <View style={styles.blockBanner}>
                    <Text style={styles.blockBannerText}>
                      {blockStatus.blockedByMe
                        ? 'Bạn đã chặn người này. Hãy bỏ chặn để tiếp tục trò chuyện.'
                        : 'Người này đã chặn bạn. Bạn không thể nhắn tin.'}
                    </Text>
                  </View>
                )}

              <FlatList
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item._id}
                style={styles.messagesContainer}
                inverted
              />

              <TypingIndicator typers={typers} />

              <View style={styles.inputArea}>
                <TextInput
                  style={styles.input}
                  placeholder={
                    !selectedRoom.isGroupChat &&
                    blockStatus &&
                    (blockStatus.blockedByMe || blockStatus.blockedMe)
                      ? 'Không thể nhắn do đang bị chặn'
                      : 'Nhập tin nhắn...'
                  }
                  value={newMessage}
                  onChangeText={setNewMessage}
                  editable={
                    !(
                      !selectedRoom.isGroupChat &&
                      blockStatus &&
                      (blockStatus.blockedByMe || blockStatus.blockedMe)
                    )
                  }
                />
                <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
                  <Text style={styles.sendButtonText}>Gửi</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.noChatSelected}>
              <Text style={styles.noChatText}>Chọn một cuộc trò chuyện để bắt đầu</Text>
            </View>
          )}
        </View>
      </View>

      <Modal visible={openCreate} animationType="slide">
        <CreateGroupModal
          friends={friends}
          onClose={() => setOpenCreate(false)}
          onCreate={async (payload) => {
            // TODO: Gửi API tạo nhóm ở đây
            console.log('Create group payload', payload);
            setOpenCreate(false);
          } } open={false}        />
      </Modal>

      <Modal visible={openSettings} animationType="slide">
        <GroupSettingsModal
          meId={String(myId)}
          room={selectedRoom!}
          friends={friends}
          onClose={() => setOpenSettings(false)}
          onUpdated={() => {}}
          open={false}
        />
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e1f24' },
  layout: { flex: 1, flexDirection: 'row' },
  sidebar: {
    width: 320,
    borderRightWidth: 1,
    borderRightColor: '#2d2e33',
    backgroundColor: '#25262b',
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2e33',
  },
  sidebarTitle: { fontSize: 20, fontWeight: '600', color: '#fff' },
  createButton: {
    backgroundColor: '#4a7cff',
    margin: 12,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: { color: '#fff', fontWeight: '600' },
  roomList: { flex: 1 },
  roomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2e33',
  },
  activeRoomItem: { backgroundColor: 'rgba(74, 124, 255, 0.18)' },
  roomAvatar: { width: 48, height: 48, borderRadius: 24, marginRight: 15 },
  roomInfo: { flex: 1 },
  roomTop: { flexDirection: 'row', alignItems: 'center' },
  roomName: { fontWeight: '600', color: '#fff', marginRight: 8 },
  lastMessage: { color: '#888', fontSize: 14 },
  mainChatArea: { flex: 1, backgroundColor: '#1e1f24' },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2e33',
  },
  peerInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  peerAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12 },
  peerMeta: { flex: 1 },
  peerName: { fontSize: 18, fontWeight: '700', color: '#fff' },
  peerStatus: { fontSize: 12, color: '#888', marginTop: 2 },
  blockBanner: {
    margin: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 180, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 180, 0, 0.35)',
  },
  blockBannerText: { color: '#ffdd99', fontSize: 13 },
  messagesContainer: { flex: 1, padding: 20 },
  messageContainer: { flexDirection: 'row', marginBottom: 15 },
  messageAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12 },
  messageContent: {
    flex: 1,
    backgroundColor: '#2d2e33',
    padding: 12,
    borderRadius: 18,
  },
  senderName: { fontWeight: '600', color: '#fff', marginBottom: 4 },
  messageText: { color: '#fff' },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#2d2e33',
  },
  input: {
    flex: 1,
    backgroundColor: '#2d2e33',
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 12,
    color: '#fff',
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#4a7cff',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 22,
  },
  sendButtonText: { color: '#fff', fontWeight: '600' },
  noChatSelected: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  noChatText: { color: '#888', fontSize: 18 },
});

export default ChatPage;
