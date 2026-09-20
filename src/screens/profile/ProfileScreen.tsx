import React, { useState } from 'react';
import {
  View, Text, Image, TouchableOpacity,
  ScrollView, StyleSheet, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUserStore } from '../../stores/userStore';
import { Colors } from '../../constants/colors';
import type { RootStackParamList } from '../../navigation/RootNavigator';

const { width: SCREEN_W } = Dimensions.get('window');
const THUMB_W = (SCREEN_W - 32 - 4) / 3;

type ContentTab = '发布' | '装备库';

const MOCK_POSTS = [
  { id: 'p1', imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80' },
  { id: 'p2', imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&auto=format&fit=crop&q=80' },
  { id: 'p3', imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=300&auto=format&fit=crop&q=80' },
];
const MOCK_GEAR_THUMBS = [
  { id: 'g1', imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&auto=format&fit=crop&q=80', name: 'CLYW Chief' },
  { id: 'g2', imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&auto=format&fit=crop&q=80', name: 'NSK 金色凹轴' },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { userInfo } = useUserStore();
  const [activeTab, setActiveTab] = useState<ContentTab>('发布');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 顶部导航 */}
      <View style={styles.navbar}>
        <Text style={styles.navTitle}>我的</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('AccountSettings')}
          accessibilityLabel="账户设置"
        >
          <Text style={styles.settingsBtn}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* 个人信息卡 */}
        <View style={styles.profileCard}>
          <Image source={{ uri: userInfo.avatarUrl }} style={styles.avatar} />
          <View style={styles.profileInfo}>
            <Text style={styles.nickname}>{userInfo.nickname}</Text>
            <Text style={styles.cityText}>📍 {userInfo.city} · 球龄 4 年</Text>
          </View>
        </View>

        {/* 数据统计 */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userInfo.followingCount}</Text>
            <Text style={styles.statLabel}>关注</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userInfo.followersCount}</Text>
            <Text style={styles.statLabel}>粉丝</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#67e8f9' }]}>{userInfo.gearsCount}</Text>
            <Text style={styles.statLabel}>🪀 悠悠球</Text>
          </View>
        </View>

        {/* 内容 Tab */}
        <View style={styles.contentTabBar}>
          {(['发布', '装备库'] as ContentTab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.contentTab, activeTab === tab && styles.contentTabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.contentTabText, activeTab === tab && styles.contentTabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 内容区 */}
        {activeTab === '发布' ? (
          <View style={styles.thumbGrid}>
            {MOCK_POSTS.map((p) => (
              <Image key={p.id} source={{ uri: p.imageUrl }} style={styles.thumbItem} />
            ))}
          </View>
        ) : (
          <View style={styles.gearList}>
            {MOCK_GEAR_THUMBS.map((g) => (
              <View key={g.id} style={styles.gearRow}>
                <Image source={{ uri: g.imageUrl }} style={styles.gearThumb} />
                <Text style={styles.gearName}>{g.name}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  navbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: '#1a1d22',
  },
  navTitle: { color: Colors.white, fontSize: 18, fontWeight: '800' },
  settingsBtn: { fontSize: 22 },
  scroll: { flex: 1 },

  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 20,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 2, borderColor: '#00c7d4',
  },
  profileInfo: { flex: 1, gap: 6 },
  nickname: { color: Colors.white, fontSize: 20, fontWeight: '900' },
  cityText: { color: '#9ca3af', fontSize: 12 },

  statsRow: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 20,
    borderTopWidth: 0.5, borderTopColor: '#1a1d22',
    borderBottomWidth: 0.5, borderBottomColor: '#1a1d22',
  },
  statItem: { alignItems: 'center', gap: 2 },
  statValue: { color: Colors.white, fontSize: 18, fontWeight: '800' },
  statLabel: { color: '#9ca3af', fontSize: 12 },
  statDivider: { width: 1, height: 28, backgroundColor: '#1f2937' },

  contentTabBar: {
    flexDirection: 'row',
    borderBottomWidth: 0.5, borderBottomColor: '#1a1d22',
  },
  contentTab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  contentTabActive: { borderBottomWidth: 2, borderBottomColor: Colors.white },
  contentTabText: { color: Colors.textMuted, fontSize: 14, fontWeight: '600' },
  contentTabTextActive: { color: Colors.white, fontWeight: '800' },

  thumbGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 2, padding: 16,
  },
  thumbItem: { width: THUMB_W, height: THUMB_W, borderRadius: 6 },

  gearList: { padding: 16, gap: 12 },
  gearRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#0c0f14', borderRadius: 12,
    borderWidth: 0.5, borderColor: '#1e2330', padding: 10,
  },
  gearThumb: { width: 56, height: 56, borderRadius: 10 },
  gearName: { color: Colors.white, fontSize: 14, fontWeight: '600', flex: 1 },
});
