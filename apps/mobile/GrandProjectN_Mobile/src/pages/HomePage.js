import React, { useRef, useCallback } from 'react';
import { View, StyleSheet, Alert, Text, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../features/auth/AuthContext';
import { COLORS } from '../styles/theme';
import Feed from '../components/Feed';
import CreatePost from '../components/CreatePost';
import { CommonActions } from '@react-navigation/native'; // Sử dụng CommonActions

const HomePage = ({ navigation }) => {
  const { logout, token, user } = useAuth();
  const feedRef = useRef(null);

  const handlePostCreated = useCallback(() => {
    if (feedRef.current && feedRef.current.fetchFeed) {
      feedRef.current.fetchFeed();
    }
  }, []);

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }
  
  return (
    <LinearGradient
      colors={[COLORS.background, '#0e0b1d']}
      style={styles.gradientContainer}
    >
      <View style={styles.mainContainer}>
        {/* Component tạo bài viết */}
        <CreatePost onPostCreated={handlePostCreated} />
        
        {/* Component hiển thị Feed */}
        <Feed ref={feedRef} />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    padding: 10,
  },
});

export default HomePage;