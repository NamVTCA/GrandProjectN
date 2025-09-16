import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, Linking } from "react-native";
import { Button } from "react-native-paper";

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  postId?: string;
  userId?: string;
}

const ReportModal: React.FC<ReportModalProps> = ({ 
  visible, 
  onClose, 
  onSubmit, 
  postId, 
  userId 
}) => {
  const [reason, setReason] = useState("");

  const handleViewPost = () => {
    if (postId) {
      // In React Native, you might navigate to post detail screen
      // or open a web view if it's a web URL
      Linking.openURL(`/posts/${postId}`).catch(err => 
        console.error('Failed to open URL:', err)
      );
    }
  };

  const handleViewProfile = () => {
    if (userId) {
      // Navigate to profile screen or open web view
      Linking.openURL(`/profile/${userId}`).catch(err => 
        console.error('Failed to open URL:', err)
      );
    }
  };

  const handleSubmit = () => {
    if (!reason.trim()) {
      alert("Vui lòng nhập lý do báo cáo");
      return;
    }
    onSubmit(reason);
    setReason("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay} onTouchEnd={onClose}>
        <View style={styles.content} onTouchEnd={(e) => e.stopPropagation()}>
          <Text style={styles.title}>🚩 Gửi báo cáo</Text>
          
          {postId && (
            <TouchableOpacity onPress={handleViewPost} style={styles.linkContainer}>
              <Text style={styles.link}>Xem bài viết được báo cáo</Text>
            </TouchableOpacity>
          )}
          
          {userId && (
            <TouchableOpacity onPress={handleViewProfile} style={styles.linkContainer}>
              <Text style={styles.link}>Xem hồ sơ người dùng</Text>
            </TouchableOpacity>
          )}
          
          <TextInput
            style={styles.textArea}
            placeholder="Nhập lý do bạn muốn báo cáo..."
            value={reason}
            onChangeText={setReason}
            multiline={true}
            numberOfLines={4}
            textAlignVertical="top"
          />
          
          <View style={styles.actions}>
            <Button 
              mode="outlined" 
              onPress={onClose}
              style={styles.button}
            >
              Hủy
            </Button>
            <Button 
              mode="contained" 
              onPress={handleSubmit}
              style={[styles.button, styles.submitButton]}
            >
              Gửi báo cáo
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  linkContainer: {
    marginBottom: 10,
  },
  link: {
    color: '#3a7ca5',
    textDecorationLine: 'underline',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    marginBottom: 15,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  button: {
    minWidth: 80,
  },
  submitButton: {
    backgroundColor: '#e0245e',
  },
});

export default ReportModal;