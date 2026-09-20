import React, { useState } from 'react';
import {
  View, Text, Image, TouchableOpacity,
  ScrollView, StyleSheet, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';

const { width: SCREEN_W } = Dimensions.get('window');
const THUMB_W = (SCREEN_W - 32 - 4) / 3;

const MOCK_USER = {
  uid: 'u_100',
  nickname: 'Hiroshi_5A',
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  styleTags: ['5A', '1A'],
  city: '东京 · 日本',
  followingCount: 234,
  followersCount: 8821,
  yoyoCount: 47,
};

const MOCK_PUBLIC_POSTS = [
  { id: 'p1', imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80' },
  { id: 'p2', imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&auto=format&fit=crop&q=80' },
  { id: 'p3', imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=300&auto=format&fit=crop&q=80' },
];

type ContentTab = '发布' | '装备库';

export default function UserProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<ContentTab>('发布');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 顶部导航 */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>{MOCK_USER.nickname}</Text>
        <TouchableOpacity>
          <Text style={styles.moreBtn}>···</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 头像 + 基本信息 */}
        <View style={styles.profileHeader}>
          <Image source={{ uri: MOCK_USER.avatarUrl }} style={styles.avatar} />
          <View style={styles.profileInfo}>
            <Text style={styles.nickname}>{MOCK_USER.nickname}</Text>
            <View style={styles.styleTagRow}>
              {MOCK_USER.styleTags.map((t) => (
                <View key={t} style={styles.styleTag}>
                  <Text style={styles.styleTagText}>{t}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.cityText}>📍 {MOCK_USER.city}</Text>
          </View>
        </View>

        {/* 数据统计 */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{MOCK_USER.followingCount}</Text>
            <Text style={styles.statLabel}>关注</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{MOCK_USER.followersCount.toLocaleString()}</Text>
            <Text style={styles.statLabel}>粉丝</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#67e8f9' }]}>{MOCK_USER.yoyoCount}</Text>
            <Text style={styles.statLabel}>🪀 悠悠球</Text>
          </View>
        </View>

        {/* 操作按钮 */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.followBtn, isFollowing && styles.followingBtn]}
            onPress={() => setIsFollowing(!isFollowing)}
          >
            <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
              {isFollowing ? '已关注' : '关注'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dmBtn}>
            <Text style={styles.dmBtnText}>私信</Text>
          </TouchableOpacity>
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

        {/* 内容区（仅展示公开内容） */}
        <View style={styles.thumbGrid}>
          {MOCK_PUBLIC_POSTS.map((p) => (
            <Image key={p.id} source={{ uri: p.imageUrl }} style={styles.thumbItem} />
          ))}
        </View>
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
  navTitle: { color: Colors.white, fontSize: 17, fontWeight: '700' },
  backBtn: { color: Colors.white, fontSize: 22 },
  moreBtn: { color: Colors.textMuted, fontSize: 20 },

  profileHeader: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    padding: 20,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 2, borderColor: '#2a2d33',
  },
  profileInfo: { flex: 1, gap: 6 },
  nickname: { color: Colors.white, fontSize: 18, fontWeight: '900' },
  styleTagRow: { flexDirection: 'row', gap: 4 },
  styleTag: {
    backgroundColor: '#1c2028', borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 0.5, borderColor: '#2e3340',
  },
  styleTagText: { color: '#8899bb', fontSize: 11, fontWeight: '700' },
  cityText: { color: '#9ca3af', fontSize: 12 },

  statsRow: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 0.5, borderTopColor: '#1a1d22',
    borderBottomWidth: 0.5, borderBottomColor: '#1a1d22',
  },
  statItem: { alignItems: 'center', gap: 2 },
  statValue: { color: Colors.white, fontSize: 18, fontWeight: '800' },
  statLabel: { color: '#9ca3af', fontSize: 12 },
  statDivider: { width: 1, height: 28, backgroundColor: '#1f2937' },

  actionRow: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 20, paddingVertical: 14,
  },
  followBtn: {
    flex: 1, backgroundColor: Colors.white,
    borderRadius: 24, paddingVertical: 10, alignItems: 'center',
  },
  followingBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#333' },
  followBtnText: { color: Colors.black, fontSize: 15, fontWeight: '700' },
  followingBtnText: { color: Colors.textMuted },
  dmBtn: {
    flex: 1, backgroundColor: 'transparent',
    borderRadius: 24, paddingVertical: 10, alignItems: 'center',
    borderWidth: 1, borderColor: '#333',
  },
  dmBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },

  contentTabBar: {
    flexDirection: 'row',
    borderBottomWidth: 0.5, borderBottomColor: '#1a1d22',
  },
  contentTab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  contentTabActive: { borderBottomWidth: 2, borderBottomColor: Colors.white },
  contentTabText: { color: Colors.textMuted, fontSize: 14, fontWeight: '600' },
  contentTabTextActive: { color: Colors.white, fontWeight: '800' },

  thumbGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, padding: 16 },
  thumbItem: { width: THUMB_W, height: THUMB_W, borderRadius: 6 },
});
