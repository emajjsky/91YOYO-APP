import React from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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

// 突出的中间 + 发布按钮
function ComposeButton() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <TouchableOpacity
      style={styles.composeBtnWrapper}
      onPress={() => navigation.navigate('Compose')}
      activeOpacity={0.85}
    >
      <View style={styles.composeBtn}>
        <Text style={styles.composeBtnIcon}>＋</Text>
      </View>
    </TouchableOpacity>
  );
}

// 空白占位页（不会真正展示）
function EmptyScreen() { return <View style={{ flex: 1, backgroundColor: '#000' }} />; }

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.white,
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
            case 'Home':    return <HomeIcon active={focused} />;
            case 'Explore': return <ExploreIcon active={focused} />;
            case '__Compose': return null; // 由 tabBarButton 接管
            case 'Gear':    return <GearIcon active={focused} />;
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
    backgroundColor: Colors.bg,
    borderTopColor: '#181a1f',
    borderTopWidth: 0.5,
    height: 84,
    paddingBottom: 28,
    paddingTop: 8,
  },
  composeBtnWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  composeBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    // 向上凸出效果
    marginTop: -14,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  composeBtnIcon: {
    color: Colors.black,
    fontSize: 26,
    fontWeight: '300',
    lineHeight: 30,
    marginTop: -2,
  },
});
