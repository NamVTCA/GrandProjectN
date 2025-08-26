import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './src/features/auth/AuthContext';
import LoginPage from './src/pages/LoginPage';
import RegisterPage from './src/pages/RegisterPage';
import ForgotPasswordPage from './src/pages/ForgotPasswordPage';
import ResetPasswordPage from './src/pages/ResetPasswordPage';
import SelectInterestsPage from './src/pages/SelectInterestsPage';
import HomePage from './src/pages/HomePage';
import PostDetailPage from './src/pages/PostDetailPage';
import GroupsPage from './src/pages/GroupsPage';
import FriendsPage from './src/pages/FriendsPage';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from './src/styles/theme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === 'Feed') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'Groups') {
          iconName = focused ? 'people-circle' : 'people-circle-outline';
        } else if (route.name === 'Friends') {
          iconName = focused ? 'chatbox-ellipses' : 'chatbox-ellipses-outline';
        }
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.text,
      tabBarStyle: {
        backgroundColor: COLORS.card,
        borderTopColor: COLORS.border,
      },
      headerShown: false,
    })}
  >
    <Tab.Screen name="Feed" component={HomePage} />
    <Tab.Screen name="Groups" component={GroupsPage} />
    <Tab.Screen name="Friends" component={FriendsPage} />
  </Tab.Navigator>
);

const AppStack = () => {
  const { user } = useAuth();
  const initialRoute = (user?.interests && user.interests.length > 0) ? 'Main' : 'SelectInterests';
  return (
    <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabNavigator} />
      <Stack.Screen name="SelectInterests" component={SelectInterestsPage} />
      <Stack.Screen name="PostDetail" component={PostDetailPage} options={{ headerShown: true, title: 'Bài viết' }} />
    </Stack.Navigator>
  );
};

const AuthStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Login" component={LoginPage} options={{ headerShown: false }} />
    <Stack.Screen name="Register" component={RegisterPage} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordPage} />
    <Stack.Screen name="ResetPassword" component={ResetPasswordPage} />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading || (isAuthenticated && !user)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <Text style={{ color: COLORS.text }}>Đang tải...</Text>
      </View>
    );
  }
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="App" component={AppStack} />
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}