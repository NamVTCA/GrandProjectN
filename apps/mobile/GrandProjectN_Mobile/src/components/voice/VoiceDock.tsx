import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Modal } from 'react-native';
import { useVoiceChannel } from '../../features/voice/useVoiceChannel.native';

type Props = { roomId: string; onClose?: () => void; autoJoin?: boolean };

const VoiceDock: React.FC<Props> = ({ roomId, onClose, autoJoin }) => {
  const { joined, micOn, deafened, sharing, remotes, remoteInfo, join, leave, toggleMic, toggleDeafen, startShare, stopShare } =
    useVoiceChannel(roomId);

  const [focusId, setFocusId] = useState<string | null>(null);

  useEffect(() => {
    if (autoJoin && !joined) join();
  }, [autoJoin, joined, join]);

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      right: 16,
      bottom: 16,
      zIndex: 40,
      width: 380,
      maxHeight: '72%',
      borderRadius: 16,
      backgroundColor: '#121419',
      borderWidth: 1,
      borderColor: '#2b2e37',
      overflow: 'hidden',
    },
    header: {
      padding: 10,
      backgroundColor: '#111827',
      borderBottomWidth: 1,
      borderBottomColor: '#242633',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerText: {
      fontWeight: '700',
      fontSize: 14,
      color: '#e5e7eb',
    },
    roomText: {
      color: '#9ca3af',
      fontWeight: '500',
    },
    chip: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      fontSize: 12,
      borderRadius: 999,
      backgroundColor: '#2a2d34',
      color: '#cbd5e1',
    },
    controls: {
      padding: 12,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    button: {
      padding: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#2d2f36',
      backgroundColor: '#1f2126',
    },
    buttonText: {
      color: '#fff',
      fontSize: 13,
    },
    buttonPrimary: {
      backgroundColor: '#2563eb',
      borderColor: '#1e40af',
    },
    buttonDanger: {
      backgroundColor: '#ef4444',
      borderColor: '#b91c1c',
    },
    remoteList: {
      padding: 12,
      maxHeight: '50%',
    },
    remoteItem: {
      borderWidth: 1,
      borderColor: '#2b2e37',
      borderRadius: 12,
      padding: 10,
      marginTop: 10,
      backgroundColor: '#0f1218',
    },
    remoteHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 8,
    },
    remoteAvatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: '#2b2e37',
    },
    remoteName: {
      fontWeight: '600',
      fontSize: 14,
      color: '#e5e7eb',
    },
    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.92)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
    },
    modalAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
    },
    modalContent: {
      width: '100%',
      maxWidth: 1600,
      padding: 10,
    },
  });

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>
            Voice — <Text style={styles.roomText}>{roomId}</Text>
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Text style={styles.chip}>{joined ? 'Đang tham gia' : 'Chưa tham gia'}</Text>
            {onClose && (
              <TouchableOpacity style={styles.button} onPress={onClose}>
                <Text style={styles.buttonText}>✖</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.controls}>
          {!joined ? (
            <TouchableOpacity style={[styles.button, styles.buttonPrimary]} onPress={join}>
              <Text style={styles.buttonText}>🔊 Join</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.button, styles.buttonDanger]} onPress={leave}>
              <Text style={styles.buttonText}>🚪 Leave</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.button} onPress={toggleMic}>
            <Text style={styles.buttonText}>{micOn ? '🎙️ Mic on' : '🔇 Mic off'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={toggleDeafen}>
            <Text style={styles.buttonText}>{deafened ? '🟢 Undeafen' : '🛑 Deafen'}</Text>
          </TouchableOpacity>
          {joined && !sharing && (
            <TouchableOpacity style={styles.button} onPress={startShare}>
              <Text style={styles.buttonText}>📺 Share screen</Text>
            </TouchableOpacity>
          )}
          {joined && sharing && (
            <TouchableOpacity style={styles.button} onPress={stopShare}>
              <Text style={styles.buttonText}>🛑 Stop share</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.remoteList}>
          {remotes.length === 0 && (
            <Text style={{ fontSize: 13, color: '#9ca3af', padding: 8 }}>
              Chưa có ai khác trong phòng…
            </Text>
          )}

          {remotes.map((r) => {
            const info = remoteInfo[r.socketId] || {};
            const isSharing = !!info.sharing;
            return (
              <View key={r.socketId} style={styles.remoteItem}>
                <View style={styles.remoteHeader}>
                  <Image
                    source={{ uri: info.avatar || '/images/default-user.svg' }}
                    style={styles.remoteAvatar}
                    onError={() => {/* Handle error */}}
                  />
                  <Text style={styles.remoteName}>{info.username || r.socketId}</Text>
                  {isSharing && <Text style={styles.chip}>đang chia sẻ màn hình</Text>}
                  {isSharing && (
                    <TouchableOpacity 
                      style={[styles.button, { marginLeft: 'auto' }]} 
                      onPress={() => setFocusId(r.socketId)}
                    >
                      <Text style={styles.buttonText}>⤢ Expand</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <Modal
        visible={!!focusId}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFocusId(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            {focusId && (() => {
              const r = remotes.find((x) => x.socketId === focusId);
              const info = remoteInfo[focusId] || {};
              return (
                <>
                  <Image
                    source={{ uri: info.avatar || '/images/default-user.svg' }}
                    style={styles.modalAvatar}
                    onError={() => {/* Handle error */}}
                  />
                  <Text style={styles.remoteName}>{info.username || focusId}</Text>
                  <TouchableOpacity 
                    style={[styles.button, { marginLeft: 'auto' }]} 
                    onPress={() => setFocusId(null)}
                  >
                    <Text style={styles.buttonText}>✖ Close</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </View>
          
          <View style={styles.modalContent}>
            {focusId && (() => {
              const r = remotes.find((x) => x.socketId === focusId);
              const info = remoteInfo[focusId] || {};
              const isSharing = !!info.sharing;
              
              if (!r) return null;
              
              return (
                <>
                  {!isSharing && (
                    <Text style={{ color: '#9ca3af', textAlign: 'center' }}>
                      Đang chờ chia sẻ màn hình…
                    </Text>
                  )}
                </>
              );
            })()}
          </View>
        </View>
      </Modal>
    </>
  );
};

export default VoiceDock;