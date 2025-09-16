import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Modal, StyleSheet } from 'react-native';
import { addRoomMembers, kickRoomMember, uploadRoomAvatar } from '../../../services/chat';
import type { PickableUser } from './CreateGroupModal';
import { ChatParticipant, ChatRoom } from '../types/chat';

type Props = {
  open: boolean;
  meId: string;
  room: ChatRoom;
  friends: PickableUser[];
  onClose: () => void;
  onUpdated: (room: ChatRoom) => void;
};

const GroupSettingsModal: React.FC<Props> = ({ open, meId, room, friends, onClose, onUpdated }) => {
  const [picking, setPicking] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [kickingUserId, setKickingUserId] = useState<string | null>(null);

  useEffect(() => { if (!open) { setPicking([]); setSearch(''); } }, [open]);

  const members: ChatParticipant[] = useMemo(
    () => (room.members || []).map((m) => m.user),
    [room.members]
  );

  const createdById = (room as any)?.createdBy;
  const canKick = useCallback((uid: string) => uid !== meId && uid !== createdById, [meId, createdById]);

  const avatarSrc = room.avatarUrl || room.avatar || '/images/default-group.png';

  const memberIdSet = useMemo(
    () => new Set(members.map((m) => String(m._id))),
    [members]
  );

  const candidates = useMemo(
    () => friends.filter((f) => !memberIdSet.has(String(f.id))),
    [friends, memberIdSet]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter((f) => (f.username || '').toLowerCase().includes(q));
  }, [candidates, search]);

  const styles = StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modal: {
      width: '90%',
      maxHeight: '80%',
      backgroundColor: '#1e1f24',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#2b2d33',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 14,
      borderBottomWidth: 1,
      borderBottomColor: '#2b2d33',
    },
    title: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold',
    },
    close: {
      color: 'white',
      fontSize: 24,
    },
    body: {
      padding: 16,
    },
    footer: {
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: '#2b2d33',
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
    },
    sectionTitle: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 14,
      opacity: 0.9,
      marginVertical: 16,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 36,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#2b2d33',
      backgroundColor: 'rgba(255,255,255,0.04)',
    },
    buttonText: {
      color: 'white',
      fontWeight: '600',
    },
    buttonPrimary: {
      borderColor: 'transparent',
      backgroundColor: '#6a5acd',
    },
    buttonDanger: {
      borderColor: 'rgba(255,75,75,0.25)',
      backgroundColor: 'rgba(255,75,75,0.06)',
      color: '#ff8b8b',
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    friendsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 8,
    },
    friend: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
      borderWidth: 1,
      borderColor: '#2b2d33',
      borderRadius: 10,
      backgroundColor: 'rgba(255,255,255,0.03)',
    },
    friendPicked: {
      borderColor: '#6a5acd',
      borderWidth: 2,
    },
    avatarSm: {
      width: 28,
      height: 28,
      borderRadius: 14,
      marginRight: 8,
    },
    avatarMd: {
      width: 32,
      height: 32,
      borderRadius: 16,
      marginRight: 10,
    },
    memberList: {
      marginTop: 8,
    },
    memberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 8,
      borderWidth: 1,
      borderColor: '#2b2d33',
      borderRadius: 10,
      backgroundColor: 'rgba(255,255,255,0.03)',
      marginTop: 8,
    },
    left: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    metaName: {
      color: 'white',
      fontWeight: '600',
    },
    metaRole: {
      color: 'rgba(255,255,255,0.65)',
      fontSize: 12,
      marginTop: 2,
    },
    searchInput: {
      width: '100%',
      height: 36,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#2b2d33',
      backgroundColor: 'rgba(255,255,255,0.03)',
      color: 'white',
      paddingHorizontal: 10,
      marginBottom: 8,
    },
  });

  if (!open) return null;

  return (
    <Modal visible={open} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Cài đặt nhóm</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.close}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body}>
            <View style={styles.row}>
              <Image
                source={{ uri: avatarSrc }}
                style={{ width: 56, height: 56, borderRadius: 28 }}
                onError={() => {/* Handle error */}}
              />
              <TouchableOpacity 
                style={[styles.button, uploading && styles.buttonDisabled]}
                disabled={uploading}
              >
                <Text style={styles.buttonText}>
                  {uploading ? 'Đang tải...' : 'Đổi avatar'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Thêm thành viên</Text>

            <TextInput
              style={styles.searchInput}
              placeholder="Tìm theo tên..."
              placeholderTextColor="#666"
              value={search}
              onChangeText={setSearch}
            />

            <View style={styles.friendsGrid}>
              {filtered.length === 0 && (
                <Text style={{ color: '#ccc', opacity: 0.7, padding: 8 }}>
                  Không còn bạn để thêm.
                </Text>
              )}

              {filtered.map((f) => {
                const fid = String(f.id);
                const checked = picking.includes(fid);

                return (
                  <TouchableOpacity
                    key={fid}
                    style={[styles.friend, checked && styles.friendPicked]}
                    onPress={() => setPicking((p) => (checked ? p.filter((x) => x !== fid) : [...p, fid]))}
                  >
                    <Image
                      source={{ uri: f.avatar || '/images/default-user.png' }}
                      style={styles.avatarSm}
                    />
                    <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                      {f.username}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary, (adding || !picking.length) && styles.buttonDisabled]}
              disabled={!picking.length || adding}
              onPress={async () => {
                try {
                  setAdding(true);
                  const updated = await addRoomMembers(room._id, picking);
                  onUpdated((updated as any)?.room ?? (updated as any));
                  setPicking([]);
                  alert('Đã thêm thành viên');
                } catch (err) {
                  console.error('Add members failed', err);
                  alert('Thêm thành viên thất bại');
                } finally {
                  setAdding(false);
                }
              }}
            >
              <Text style={styles.buttonText}>
                {adding ? 'Đang thêm...' : `Thêm (${picking.length})`}
              </Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Thành viên ({members.length})</Text>

            <View style={styles.memberList}>
              {members.map((m, idx) => (
                <View key={m._id} style={[styles.memberRow, idx === 0 && { marginTop: 0 }]}>
                  <View style={styles.left}>
                    <Image
                      source={{ uri: m.avatar || '/images/default-user.png' }}
                      style={styles.avatarMd}
                    />
                    <View>
                      <Text style={styles.metaName}>{m.username}</Text>
                      {(room as any)?.createdBy === m._id && (
                        <Text style={styles.metaRole}>Chủ nhóm</Text>
                      )}
                      {meId === m._id && (
                        <Text style={styles.metaRole}>Bạn</Text>
                      )}
                    </View>
                  </View>

                  {canKick(m._id) && (
                    <TouchableOpacity
                      style={[styles.button, styles.buttonDanger, kickingUserId === m._id && styles.buttonDisabled]}
                      disabled={kickingUserId === m._id}
                      onPress={async () => {
                        if (!confirm(`Kick ${m.username}?`)) return;
                        try {
                          setKickingUserId(m._id);
                          const updated = await kickRoomMember(room._id, m._id);
                          onUpdated((updated as any)?.room ?? (updated as any));
                          alert('Đã kick khỏi nhóm');
                        } catch (err) {
                          console.error('Kick member failed', err);
                          alert('Kick thất bại');
                        } finally {
                          setKickingUserId(null);
                        }
                      }}
                    >
                      <Text style={[styles.buttonText, { color: '#ff8b8b' }]}>
                        {kickingUserId === m._id ? 'Đang kick...' : 'Kick'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default GroupSettingsModal;