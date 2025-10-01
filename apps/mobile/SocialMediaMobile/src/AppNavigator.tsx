import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { StackParamList } from "../src/navigation/types";

// Auth
import LoginScreen from "../src/screens/LoginScreen";
import RegisterScreen from "../src/screens/RegisterScreen";
import ForgotPasswordScreen from "../src/screens/ForgotPasswordScreen";

// Core
import HomeScreen from "../src/screens/HomeScreen";
import FeedScreen from "../src/screens/FeedScreen";
import CreatePostScreen from "../src/screens/CreatePostScreen";
import EditPostScreen from "../src/screens/EditPostScreen";
import CommentScreen from "../src/screens/CommentScreen";
import ProfileScreen from "../src/screens/ProfileScreen";

// Groups
import GroupListScreen from "../src/screens/GroupListScreen";
import GroupDetailScreen from "../src/screens/GroupDetailScreen";
import GroupFeedScreen from "../src/screens/GroupFeedScreen";
import GroupMembersScreen from "../src/screens/GroupMembersScreen";
import GroupRequestsScreen from "../src/screens/GroupRequestsScreen";
import GroupInvitesScreen from "../src/screens/GroupInvitesScreen";
import InviteMembersScreen from "../src/screens/InviteMembersScreen";
import MyInvitesScreen from "../src/screens/MyInvitesScreen";
import CreateGroupScreen from "../src/screens/CreateGroupScreen";

const Stack = createNativeStackNavigator<StackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        {/* Auth */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

        {/* Core */}
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Feed" component={FeedScreen} />
        <Stack.Screen name="CreatePost" component={CreatePostScreen} />
        <Stack.Screen name="EditPost" component={EditPostScreen} />
        <Stack.Screen name="Comments" component={CommentScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />

        {/* Groups */}
        <Stack.Screen name="GroupList" component={GroupListScreen} />
        <Stack.Screen name="GroupDetail" component={GroupDetailScreen} />
        <Stack.Screen name="GroupFeed" component={GroupFeedScreen} />
        <Stack.Screen name="GroupMembers" component={GroupMembersScreen} />
        <Stack.Screen name="GroupRequests" component={GroupRequestsScreen} />
        <Stack.Screen name="GroupInvites" component={GroupInvitesScreen} />
        <Stack.Screen name="InviteMembers" component={InviteMembersScreen} />
        <Stack.Screen name="MyInvites" component={MyInvitesScreen} />
        <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
