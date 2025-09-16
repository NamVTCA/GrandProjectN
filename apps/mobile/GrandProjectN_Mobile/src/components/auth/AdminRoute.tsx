import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useAuth } from '../../features/auth/AuthContext';
import { useNavigation } from '@react-navigation/native';

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const navigation = useNavigation();

  React.useEffect(() => {
    if (!isLoading) {
      if (user?.globalRole !== 'ADMIN') {
        navigation.navigate('Home' as never);
      }
    }
  }, [user, isLoading, navigation]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Đang kiểm tra quyền truy cập...</Text>
      </View>
    );
  }

  if (user?.globalRole !== 'ADMIN') {
    return null;
  }

  return <>{children}</>;
};

export default AdminRoute;