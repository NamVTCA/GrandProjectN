import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomePage from '../pages/Main/HomePage';
import GroupsPage from '../pages/Main/GroupsPage';
import ProfilePage from '../pages/Main/ProfilePage';
import { colors } from '../styles/theme';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'GroupsTab') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          }
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomePage} options={{ title: 'Trang chủ' }}/>
      <Tab.Screen name="GroupsTab" component={GroupsPage} options={{ title: 'Nhóm' }} />
      <Tab.Screen name="ProfileTab" component={ProfilePage} options={{ title: 'Cá nhân' }}/>
    </Tab.Navigator>
  );
};

export default MainTabNavigator;