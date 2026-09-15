import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabNavigator from './MainTabNavigator';
import ComposeScreen from '../screens/compose/ComposeScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import JamScreen from '../screens/jam/JamScreen';
import UserProfileScreen from '../screens/profile/UserProfileScreen';
import PostDetailScreen from '../screens/post/PostDetailScreen';
import AuthScreen from '../screens/auth/AuthScreen';
import SetupRequiredScreen from '../screens/auth/SetupRequiredScreen';
import { useAuthStore } from '../stores/authStore';

export type RootStackParamList = {
  MainTabs: undefined;
  Compose: undefined;
  Chat: { gearId?: string; seller?: string };
  Jam: undefined;
  UserProfile: { userId: string };
  PostDetail: { postId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const status = useAuthStore((state) => state.status);
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  if (status === 'setup_required') return <SetupRequiredScreen />;
  if (status === 'signed_out') return <AuthScreen />;
  if (status === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#ffffff" />
      </View>
    );
  }

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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
