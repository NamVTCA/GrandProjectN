import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, Modal, Pressable } from 'react-native';
import axios from 'axios';
import { globalStyles, COLORS } from '../styles/theme';
import { useAuth } from '../features/auth/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const ReactionType = {
  LIKE: 'LIKE',
  LOVE: 'LOVE',
  HAHA: 'HAHA',
  WOW: 'WOW',
  SAD: 'SAD',
  ANGRY: 'ANGRY',
};

const ReactionIcons = {
  [ReactionType.LIKE]: { icon: 'thumbs-up', color: '#0077b6' },
  [ReactionType.LOVE]: { icon: 'heart', color: '#e74c3c' },
  [ReactionType.HAHA]: { icon: 'happy', color: '#f1c40f' },
  [ReactionType.WOW]: { icon: 'flame', color: '#f39c12' },
  [ReactionType.SAD]: { icon: 'sad', color: '#3498db' },
  [ReactionType.ANGRY]: { icon: 'alert-circle-sharp', color: '#c0392b' },
};

const PostCard = ({ post }) => {
  const { user, token, logout } = useAuth();
  const navigation = useNavigation();
  const [currentPost, setCurrentPost] = useState(post);
  const [showReactionMenu, setShowReactionMenu] = useState(false);
  const isRepost = !!currentPost.repostOf;
  const displayPost = isRepost ? currentPost.repostOf : currentPost;
  const author = displayPost.author;
  
  const userReaction = currentPost.reactions?.find(reaction => reaction.user.toString() === user?._id);

  const handleToggleReaction = async (type) => {
    try {
      const response = await axios.post(
        `http://192.168.20.107:8888/api/posts/${currentPost._id}/react`,
        { type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCurrentPost(response.data);
      setShowReactionMenu(false);
    } catch (error) {
      if (error.response?.status === 401) {
        Alert.alert("Phiên làm việc đã hết hạn", "Vui lòng đăng nhập lại.");
        logout();
      } else {
        console.error('Lỗi khi tương tác bài viết:', error);
        Alert.alert('Lỗi', error.response?.data?.message || 'Không thể tương tác với bài viết.');
      }
    }
  };

  const handleComment = () => {
    navigation.navigate('PostDetail', { postId: currentPost._id });
  };

  const handleRepost = async () => {
    try {
      await axios.post(
        `http://192.168.20.107:8888/api/posts/${currentPost._id}/repost`,
        { visibility: 'PUBLIC' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Thành công', 'Bài viết đã được chia sẻ.');
    } catch (error) {
      console.error('Lỗi khi chia sẻ bài viết:', error);
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể chia sẻ bài viết này.');
    }
  };
  
  const getAvatarUrl = (path) => {
    return path ? `http://192.168.20.107:8888/${path}` : 'https://via.placeholder.com/150';
  };

  return (
    <View style={styles.card}>
      {isRepost && (
        <Text style={styles.repostText}>
          <Text style={styles.repostAuthor}>{currentPost.author.username}</Text> đã chia sẻ
        </Text>
      )}
      <View style={styles.header}>
        <Image
          source={{ uri: getAvatarUrl(author.avatar) }}
          style={styles.avatar}
        />
        <View>
          <Text style={styles.username}>{author.username}</Text>
          <Text style={styles.postDate}>{new Date(displayPost.createdAt).toLocaleString()}</Text>
        </View>
      </View>
      <Text style={styles.content}>{displayPost.content}</Text>
      {displayPost.mediaUrls && displayPost.mediaUrls.length > 0 && (
        <Image source={{ uri: `http://192.168.20.107:8888/${displayPost.mediaUrls[0]}` }} style={styles.postImage} />
      )}
      
      {currentPost.reactions.length > 0 && (
        <View style={styles.reactionsSummary}>
          {Object.keys(ReactionIcons).map((type, index) => {
            const count = currentPost.reactions.filter(r => r.type === type).length;
            if (count > 0) {
              return (
                <View key={index} style={styles.reactionIcon}>
                  <Ionicons name={ReactionIcons[type].icon} size={16} color={ReactionIcons[type].color} />
                  <Text style={styles.reactionCount}>{count}</Text>
                </View>
              );
            }
            return null;
          })}
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.footerButton} 
          onPress={() => handleToggleReaction(ReactionType.LIKE)}
          onLongPress={() => setShowReactionMenu(true)}
        >
          <Ionicons name={userReaction ? ReactionIcons[userReaction.type].icon : "thumbs-up-outline"} size={20} color={userReaction ? ReactionIcons[userReaction.type].color : COLORS.secondary} />
          <Text style={[styles.footerText, userReaction && { color: userReaction.type === ReactionType.LIKE ? ReactionIcons[ReactionType.LIKE].color : userReaction.type === ReactionType.LOVE ? ReactionIcons[ReactionType.LOVE].color : userReaction.type === ReactionType.HAHA ? ReactionIcons[ReactionType.HAHA].color : userReaction.type === ReactionType.WOW ? ReactionIcons[ReactionType.WOW].color : userReaction.type === ReactionType.SAD ? ReactionIcons[ReactionType.SAD].color : userReaction.type === ReactionType.ANGRY ? ReactionIcons[ReactionType.ANGRY].color : COLORS.secondary}]}>{userReaction ? userReaction.type : 'Thích'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleComment} style={styles.footerButton}>
          <Ionicons name="chatbubble-outline" size={20} color={COLORS.secondary} />
          <Text style={styles.footerText}>Bình luận ({currentPost.commentCount})</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleRepost} style={styles.footerButton}>
          <Ionicons name="repeat" size={20} color={COLORS.secondary} />
          <Text style={styles.footerText}>Chia sẻ ({currentPost.repostCount})</Text>
        </TouchableOpacity>
      </View>

      {/* Menu thả cảm xúc */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showReactionMenu}
        onRequestClose={() => setShowReactionMenu(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowReactionMenu(false)}>
          <View style={styles.reactionMenu}>
            {Object.keys(ReactionIcons).map((type, index) => (
              <TouchableOpacity key={index} style={styles.reactionOption} onPress={() => handleToggleReaction(type)}>
                <Ionicons name={ReactionIcons[type].icon} size={30} color={ReactionIcons[type].color} />
                <Text style={styles.reactionOptionText}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    ...globalStyles.card,
    marginBottom: 15,
  },
  repostText: {
    color: COLORS.secondary,
    marginBottom: 5,
    fontSize: 12,
  },
  repostAuthor: {
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  username: {
    fontWeight: 'bold',
    color: COLORS.text,
  },
  postDate: {
    color: COLORS.placeholder,
    fontSize: 12,
  },
  content: {
    color: COLORS.text,
    fontSize: 16,
    marginBottom: 10,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  reactionsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  reactionIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  reactionCount: {
    color: COLORS.text,
    marginLeft: 4,
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    color: COLORS.secondary,
    marginLeft: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  reactionMenu: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 50,
    padding: 10,
    justifyContent: 'space-around',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  reactionOption: {
    alignItems: 'center',
    padding: 5,
  },
  reactionOptionText: {
    color: COLORS.text,
    fontSize: 10,
  },
});

export default PostCard;