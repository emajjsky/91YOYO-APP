import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabNavigator from './MainTabNavigator';
import ComposeScreen from '../screens/compose/ComposeScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import JamScreen from '../screens/jam/JamScreen';
import UserProfileScreen from '../screens/profile/UserProfileScreen';
import PostDetailScreen from '../screens/post/PostDetailScreen';
import AccountSettingsScreen from '../screens/profile/AccountSettingsScreen';

export type RootStackParamList = {
  MainTabs: undefined;
  Compose: undefined;
  Chat: { gearId?: string; seller?: string };
  Jam: undefined;
  UserProfile: { userId: string };
  PostDetail: { postId: string };
  AccountSettings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#000000' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        <Stack.Screen
          name="Compose"
          component={ComposeScreen}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="Jam" component={JamScreen} />
        <Stack.Screen name="UserProfile" component={UserProfileScreen} />
        <Stack.Screen name="PostDetail" component={PostDetailScreen} />
        <Stack.Screen name="AccountSettings" component={AccountSettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
