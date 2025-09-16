import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Image, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import CheckBox from '@react-native-community/checkbox';
import { getInviteCandidates, sendGroupInvites, type InviteCandidate } from '../../../services/group.api';
import { publicUrl } from '../../../untils/publicUrl';

type Props = {
  open: boolean;
  groupId: string;
  onClose: () => void;
  onSent?: (created: number) => void;
};

const FALLBACK_AVATAR = 'https://placehold.co/80x80/363a41/f0f2f5?text=User';

const getAvatarSrc = (u: InviteCandidate): string => {
  return u.avatar ? publicUrl(u.avatar) : FALLBACK_AVATAR;
};

const InviteFriendsModal: React.FC<Props> = ({ open, groupId, onClose, onSent }) => {
  const [q, setQ] = useState('');
  const [candidates, setCandidates] = useState<InviteCandidate[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getInviteCandidates(groupId, q)
      .then((data) => setCandidates(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [open, q, groupId]);

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleSend = async () => {
    if (selected.size === 0) return;
    setSending(true);
    try {
      const result = await sendGroupInvites({ groupId, inviteeIds: Array.from(selected) });
      onSent?.(result.created);
      setSelected(new Set());
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Mời bạn bè</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Search */}
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm bạn bè..."
            placeholderTextColor="#9AA0A6"
            value={q}
            onChangeText={setQ}
          />

          {/* Candidates */}
          <ScrollView style={styles.candidatesList}>
            {loading && (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Đang tải...</Text>
              </View>
            )}

            {!loading && candidates.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Không tìm thấy bạn bè nào</Text>
              </View>
            )}

            {candidates.map((c) => {
              const id = c.id;
              const name = c.username || c.fullName || '';
              const avatar = getAvatarSrc(c);

              return (
                <TouchableOpacity
                  key={id}
                  style={styles.candidateItem}
                  onPress={() => toggleSelect(id)}
                >
                  <View style={styles.candidateInfo}>
                    <Image style={styles.candidateAvatar} source={{ uri: avatar }} />
                    <Text style={styles.candidateName}>{name}</Text>
                  </View>
                  <CheckBox
                    value={selected.has(id)}
                    onValueChange={() => toggleSelect(id)}
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.sendButton, (selected.size === 0 || sending) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={selected.size === 0 || sending}
            >
              <Text style={styles.sendButtonText}>
                {sending ? 'Đang gửi...' : `Gửi lời mời (${selected.size})`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2A2A35',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A45',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  searchInput: {
    backgroundColor: '#3A3A45',
    borderRadius: 8,
    padding: 12,
    margin: 16,
    color: '#FFFFFF',
  },
  candidatesList: {
    maxHeight: 300,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#9AA0A6',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9AA0A6',
  },
  candidateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A45',
  },
  candidateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  candidateAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  candidateName: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#3A3A45',
  },
  sendButton: {
    backgroundColor: '#31D0AA',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#4A5568',
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default InviteFriendsModal;
