import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Modal, StyleSheet } from 'react-native';

export type PickableUser = {
  id: string;
  username: string;
  avatar?: string | null;
};

type Props = {
  open: boolean;
  friends: PickableUser[];
  onClose: () => void;
  onCreate: (payload: { name: string; memberIds: string[]; avatarFile?: File | null }) => Promise<void>;
};

const CreateGroupModal: React.FC<Props> = ({ open, friends, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setName('');
      setPicked([]);
      setSearch('');
      setAvatarFile(null);
      setAvatarPreview(null);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return friends || [];
    return (friends || []).filter((f) => (f.username || '').toLowerCase().includes(q));
  }, [friends, search]);

  const toggle = (id: string) => {
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const submit = async () => {
    if (picked.length === 0) return;
    setSubmitting(true);
    try {
      await onCreate({ name: name.trim(), memberIds: picked, avatarFile });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const styles = StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modal: {
      width: '90%',
      maxHeight: '80%',
      backgroundColor: '#1f1f25',
      borderRadius: 12,
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold',
    },
    close: {
      color: '#bbb',
      fontSize: 24,
    },
    input: {
      backgroundColor: '#15151b',
      color: '#e5e5e5',
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#2a2a35',
    },
    friendsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 16,
    },
    friend: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#181820',
      borderRadius: 8,
      padding: 8,
      margin: 4,
      borderWidth: 1,
      borderColor: '#2a2a35',
    },
    friendPicked: {
      borderColor: '#3b82f6',
      backgroundColor: '#111827',
    },
    avatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      marginRight: 8,
    },
    friendName: {
      color: '#e5e5e5',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
    },
    button: {
      backgroundColor: '#2a2a35',
      borderWidth: 1,
      borderColor: '#2f2f3a',
      color: '#ddd',
      borderRadius: 8,
      padding: 8,
    },
    buttonPrimary: {
      backgroundColor: '#2563eb',
      borderColor: '#2563eb',
      color: 'white',
    },
    buttonDisabled: {
      opacity: 0.6,
    },
  });

  if (!open) return null;

  return (
    <Modal visible={open} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Tạo nhóm mới</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.close}>×</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Tên nhóm (tuỳ chọn)"
            placeholderTextColor="#6b7280"
            value={name}
            onChangeText={setName}
          />

          <TextInput
            style={styles.input}
            placeholder="Tìm theo tên..."
            placeholderTextColor="#6b7280"
            value={search}
            onChangeText={setSearch}
          />

          <ScrollView style={{ maxHeight: 200 }}>
            <View style={styles.friendsGrid}>
              {filtered.map((f) => {
                const checked = picked.includes(f.id);
                return (
                  <TouchableOpacity
                    key={f.id}
                    style={[styles.friend, checked && styles.friendPicked]}
                    onPress={() => toggle(f.id)}
                  >
                    <Image
                      source={{ uri: f.avatar || '/images/default-user.png' }}
                      style={styles.avatar}
                    />
                    <Text style={styles.friendName}>{f.username}</Text>
                  </TouchableOpacity>
                );
              })}
              {filtered.length === 0 && (
                <Text style={{ color: '#999', textAlign: 'center', width: '100%' }}>
                  Không có bạn nào khớp tìm kiếm.
                </Text>
              )}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={{ color: '#ddd' }}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary, (picked.length === 0 || submitting) && styles.buttonDisabled]}
              onPress={submit}
              disabled={picked.length === 0 || submitting}
            >
              <Text style={{ color: 'white' }}>
                {submitting ? 'Đang tạo...' : `Tạo nhóm (${picked.length})`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CreateGroupModal;