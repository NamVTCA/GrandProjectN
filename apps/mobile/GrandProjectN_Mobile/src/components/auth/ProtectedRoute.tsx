import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useAuth } from '../../features/auth/AuthContext';
import { useNavigation } from '@react-navigation/native';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const navigation = useNavigation();

  React.useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigation.navigate('Login' as never);
      } else if (user?.accountStatus === 'BANNED') {
        navigation.navigate('Banned' as never);
      } else if (user && !user.hasSelectedInterests) {
        navigation.navigate('SelectInterests' as never);
      }
    }
  }, [isAuthenticated, user, isLoading, navigation]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Đang tải...</Text>
      </View>
    );
  }

  if (!isAuthenticated || user?.accountStatus === 'BANNED' || (user && !user.hasSelectedInterests)) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;