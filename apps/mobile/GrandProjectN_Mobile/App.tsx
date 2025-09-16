// File: App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, Text, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';

// Pages
import HomePage from './src/pages/HomePage.native';
import GroupsPage from './src/pages/GroupsPage.native';
import ChatPage from './src/pages/ChatPage.native';
import ShopPage from './src/pages/ShopPage.native';
import ProfilePage from './src/pages/ProfilePage.native';
import EditProfileUser from './src/features/profile/pages/EditProfileUser.native';
import AdminDashboardPage from './src/pages/admin/AdminDashboard.native';
import UserManagementPage from './src/pages/admin/UserManagement.native';
import ContentManagementPage from './src/pages/admin/ContentManagement.native';
import AdminTransactionsPage from './src/pages/admin/AdminTransactionsPage.native';
import SelectInterestsPage from './src/pages/SelectInterestsPage.native';
import TopUpPage from './src/pages/TopUpPage.native';
import UserReportsPage from './src/pages/UserReportsPage.native';
import CreateGroupPage from './src/pages/CreateGroupPage.native';
import GroupManagementPage from './src/pages/GroupManagementPage.native';
import GroupDetailPage from './src/pages/GroupDetailPage.native';
import InventoryPage from './src/pages/InventoryPage.native';
import NotificationsPage from './src/pages/NotificationsPage.native';
import FriendsListPage from './src/pages/FriendsListPage.native';
import LoginPage from './src/pages/LoginPage.native';
import RegisterPage from './src/pages/RegisterPage.native';
import ForgotPasswordPage from './src/pages/ForgotPasswordPage.native';
import ResetPasswordPage from './src/pages/ResetPasswordPage.native';
import VerifyEmailPage from './src/pages/VerifyEmailPage.native';
import BannedPage from './src/pages/BannedPage.native';

// Auth Context
import { useAuth, AuthProvider } from './src/features/auth/AuthContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

function MainTabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomePage} />
      <Tab.Screen name="Groups" component={GroupsPage} />
      <Tab.Screen name="Chat" component={ChatPage} />
      <Tab.Screen name="Shop" component={ShopPage} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfilePage} />
      <Stack.Screen name="EditProfile" component={EditProfileUser} />
    </Stack.Navigator>
  );
}

function AdminStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboardPage} />
      <Stack.Screen name="UserManagement" component={UserManagementPage} />
      <Stack.Screen name="ContentManagement" component={ContentManagementPage} />
      <Stack.Screen name="AdminTransactions" component={AdminTransactionsPage} />
    </Stack.Navigator>
  );
}

// Component chính sử dụng useAuth
function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Đang tải...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          user.globalRole === 'ADMIN' ? (
            <Stack.Screen name="Admin" component={AdminStackNavigator} />
          ) : (
            <Stack.Screen name="MainApp" component={MainTabNavigator} />
          )
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginPage} />
            <Stack.Screen name="Register" component={RegisterPage} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordPage} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordPage} />
            <Stack.Screen name="VerifyEmail" component={VerifyEmailPage} />
            <Stack.Screen name="Banned" component={BannedPage} />
          </>
        )}
      </Stack.Navigator>
      <Toast />
    </NavigationContainer>
  );
}

// Export App được bọc AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
