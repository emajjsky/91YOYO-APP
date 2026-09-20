import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Plus } from 'lucide-react-native';
import HomeScreen from '../screens/home/HomeScreen';
import ExploreScreen from '../screens/explore/ExploreScreen';
import GearScreen from '../screens/gear/GearScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { HomeIcon, ExploreIcon, GearIcon, ProfileIcon } from '../components/TabBarIcons';
import { Colors } from '../constants/colors';
import type { RootStackParamList } from './RootNavigator';

export type MainTabParamList = {
  Home: undefined;
  Explore: undefined;
  __Compose: undefined; // 占位，实际不渲染页面
  Gear: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_LABELS: Record<string, string> = {
  Home: '首页',
  Explore: '探索',
  Gear: '装备',
  Profile: '我的',
};

function ComposeButton() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <Pressable
      accessibilityLabel="发布"
      accessibilityRole="button"
      style={styles.composeBtnWrapper}
      onPress={() => navigation.navigate('Compose')}
    >
      <View style={styles.composeBtn}>
        <Plus color={Colors.background} size={25} strokeWidth={2.5} />
      </View>
    </Pressable>
  );
}

function EmptyScreen() { return <View style={{ flex: 1, backgroundColor: Colors.background }} />; }

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
        tabBarActiveTintColor: Colors.textPrimary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabel: ({ color }) => {
          if (route.name === '__Compose') return null;
          return (
            <Text style={{ color, fontSize: 10, fontWeight: '600', marginTop: 2 }}>
              {TAB_LABELS[route.name]}
            </Text>
          );
        },
        tabBarIcon: ({ focused }) => {
          switch (route.name) {
            case 'Home': return <HomeIcon active={focused} />;
            case 'Explore': return <ExploreIcon active={focused} />;
            case '__Compose': return null;
            case 'Gear': return <GearIcon active={focused} />;
            case 'Profile': return <ProfileIcon active={focused} />;
            default:        return null;
          }
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen
        name="__Compose"
        component={EmptyScreen}
        options={{
          tabBarButton: () => <ComposeButton />,
        }}
      />
      <Tab.Screen name="Gear" component={GearScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.background,
    borderTopColor: Colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    height: 80,
    paddingBottom: 22,
    paddingTop: 6,
  },
  tabBarItem: { minWidth: 64 },
  composeBtnWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },
  composeBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -10,
  },
});
