import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { AuthContext } from '../features/auth/AuthContext';
import { colors } from '../styles/theme';

// Import các màn hình
import LoginPage from '../pages/Auth/LoginPage';
import RegisterPage from '../pages/Auth/RegisterPage';
import SelectInterestsPage from '../pages/Main/SelectInterestsPage';
import MainTabNavigator from './MainTabNavigator';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user, token, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // ❗️ LOGIC KIỂM TRA MỚI VÀ CHÍNH XÁC HƠN
  const userHasCompletedOnboarding = user && (user.hasSelectedInterests || (user.interests && user.interests.length > 0));

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token === null ? (
          // Luồng CHƯA đăng nhập
          <>
            <Stack.Screen name="Login" component={LoginPage} />
            <Stack.Screen name="Register" component={RegisterPage} />
          </>
        ) : (
          // Luồng ĐÃ đăng nhập
          <>
            {userHasCompletedOnboarding ? (
              // Nếu đã chọn sở thích -> Vào ứng dụng chính
              <Stack.Screen name="MainApp" component={MainTabNavigator} />
            ) : (
              // Nếu chưa -> Vào màn hình chọn sở thích
              <Stack.Screen name="SelectInterests" component={SelectInterestsPage} />
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;