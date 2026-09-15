import React, { useState } from 'react';
import {
  View, Text, Image, TouchableOpacity,
  ScrollView, StyleSheet, Alert, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '../../stores/userStore';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../stores/authStore';

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

const PRIVACY_OPTIONS = [
  '谁可以看我的帖子',
  '谁可以看我的装备库',
  '谁可以看我的关注列表',
  '谁可以给我发私信',
];

const SETTINGS_ITEMS = [
  { label: '基本资料', icon: '👤' },
  { label: '关注领域（花式）', icon: '🪀' },
  { label: '所在地区', icon: '📍' },
  { label: '隐私设置', icon: '🔒' },
  { label: '退出登录', icon: '↪' },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { userInfo } = useUserStore();
  const signOut = useAuthStore((state) => state.signOut);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const [activeTab, setActiveTab] = useState<ContentTab>('发布');
  const [showSettings, setShowSettings] = useState(false);

  const handleSettingsTap = (label: string) => {
    if (label === '退出登录') {
      Alert.alert('退出登录', '退出后需要重新验证手机号才能继续发布和互动。', [
        { text: '取消', style: 'cancel' },
        { text: '退出', style: 'destructive', onPress: () => void signOut() },
      ]);
      return;
    }
    if (label === '隐私设置') {
      Alert.alert('隐私设置', PRIVACY_OPTIONS.join('\n'), [{ text: '关闭' }]);
    } else {
      Alert.alert(label, '编辑功能即将上线', [{ text: '好的' }]);
    }
  };

  if (showSettings) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.navbar}>
          <TouchableOpacity onPress={() => setShowSettings(false)}>
            <Text style={styles.backBtn}>‹ 返回</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>账户设置</Text>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView style={styles.scroll}>
          {SETTINGS_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.settingRow}
              onPress={() => handleSettingsTap(item.label)}
              disabled={isSubmitting}
            >
              <Text style={styles.settingIcon}>{item.icon}</Text>
              <Text style={styles.settingLabel}>{item.label}</Text>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 顶部导航 */}
      <View style={styles.navbar}>
        <Text style={styles.navTitle}>我的</Text>
        <TouchableOpacity onPress={() => setShowSettings(true)}>
          <Text style={styles.settingsBtn}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* 个人信息卡 */}
        <View style={styles.profileCard}>
          <Image source={{ uri: userInfo.avatarUrl }} style={styles.avatar} />
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.nickname}>{userInfo.nickname}</Text>
              <View style={styles.styleTag}>
                <Text style={styles.styleTagText}>{userInfo.levelTag}</Text>
              </View>
            </View>
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
  backBtn: { color: Colors.white, fontSize: 20 },
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
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nickname: { color: Colors.white, fontSize: 20, fontWeight: '900' },
  styleTag: {
    backgroundColor: '#0f1a2e', borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 2,
    borderWidth: 0.5, borderColor: '#1e3a5f',
  },
  styleTagText: { color: '#67aaff', fontSize: 12, fontWeight: '700' },
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

  // 设置页
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 16, paddingHorizontal: 20,
    borderBottomWidth: 0.5, borderBottomColor: '#1a1d22',
  },
  settingIcon: { fontSize: 20 },
  settingLabel: { color: Colors.white, fontSize: 15, flex: 1 },
  settingArrow: { color: Colors.textMuted, fontSize: 20 },
});
