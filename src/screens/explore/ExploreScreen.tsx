import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, FlatList, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { POST_CATEGORIES } from '../../constants/categories';
import { filterExploreItems } from './exploreSearch';

type CategoryId = typeof POST_CATEGORIES[number]['id'];

const MOCK_EXPLORE: Record<CategoryId, { id: string; title: string; desc: string; likes: number }[]> = {
  daily: [
    { id: 'e1', title: '练习日记 · 第 30 天', desc: '坚持每天练一小时 Brent Stole，今天终于做稳了！', likes: 42 },
    { id: 'e2', title: '新球开箱 · CLYW Blizzard', desc: '渐变阳极太好看了，空转稳如老狗 🪀', likes: 88 },
  ],
  music: [
    { id: 'e3', title: 'CYSO 2026 决赛伴奏合集', desc: 'BPM 128-140 精选 8 首，全部剪成 3min 标准时长', likes: 204 },
    { id: 'e4', title: 'Pendulum 最适合 4A 的 5 首歌', desc: '大开大合节奏感强，推荐 The Island', likes: 77 },
  ],
  tutorial: [
    { id: 'e5', title: 'Kwyjibo 分步拆解（5A）', desc: '搭线过程逐帧分析，附慢放视频', likes: 316 },
    { id: 'e6', title: '1A 速度流入门 · Shockwave', desc: '适合 Lv.4-5 球手，从直线到交叉搭线', likes: 153 },
  ],
  contest: [
    { id: 'e7', title: '2025 WYYC 1A 冠军 Free Style 完整视频', desc: '日本选手 Hiroshi 3 分钟满分演出', likes: 892 },
    { id: 'e8', title: 'CYSO 2026 上海站 3A 决赛精彩集锦', desc: '双手机技太丝滑了，双球同步率 99%', likes: 441 },
  ],
  event_news: [
    { id: 'e9', title: 'CYSO 2026 全国总决赛报名开始！', desc: '11月15日广州站，1A~5A全组别，截止10月31日', likes: 567 },
    { id: 'e10', title: '2026 WYYC 确认在布拉格举办', desc: '7月第三周，主办方公布报名细则', likes: 389 },
  ],
  product: [
    { id: 'e11', title: 'YoyoFactory 2026 新品 Shutter Beyond 发布', desc: '全铝 H 型设计，竞技向强化版，\$65 USD', likes: 234 },
    { id: 'e12', title: 'CLYW x iYoyo 联名款限量开售', desc: '500 只限量，3 种配色，下午 3 点开抢', likes: 721 },
  ],
  meetup: [
    { id: 'e13', title: '北京 Jam · 朝阳公园 | 本周六', desc: '下午 2-6 点，all style 欢迎，带球就行 📍', likes: 93 },
    { id: 'e14', title: '上海月度约球 · 静安雕塑公园', desc: '9月21日，有 5A 高手现场教学', likes: 67 },
  ],
};

const HOT_TAGS: Record<CategoryId, string[]> = {
  daily:      ['#日常练习', '#悠悠球', '#开箱'],
  music:      ['#CYSO2026', '#比赛伴奏', '#BPM132'],
  tutorial:   ['#招式教学', '#5A离手', '#慢放拆解'],
  contest:    ['#WYYC', '#CYSO', '#1A冠军'],
  event_news: ['#CYSO2026', '#赛事报名', '#WYYC布拉格'],
  product:    ['#新品发布', '#CLYW', '#YoyoFactory'],
  meetup:     ['#北京Jam', '#约球', '#线下聚会'],
};

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryId>('daily');

  const categoryItems = MOCK_EXPLORE[activeCategory] ?? [];
  const searchableItems = searchText.trim()
    ? Object.values(MOCK_EXPLORE).flat()
    : categoryItems;
  const items = filterExploreItems(searchableItems, searchText);
  const hotTags = HOT_TAGS[activeCategory] ?? [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 搜索栏 */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="搜索用户、帖子、话题..."
          placeholderTextColor={Colors.textMuted}
          value={searchText}
          onChangeText={setSearchText}
          returnKeyType="search"
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 分类横向 Tab */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catScroll}
        contentContainerStyle={styles.catContent}
      >
        {POST_CATEGORIES.map((cat) => {
          const active = activeCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catPill, active && styles.catPillActive]}
              onPress={() => setActiveCategory(cat.id as CategoryId)}
            >
              <Text style={[styles.catPillText, active && styles.catPillTextActive]}>
                {cat.emoji} {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* 帖子列表 */}
        {items.map((item) => (
          <TouchableOpacity key={item.id} style={styles.card} activeOpacity={0.8}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDesc} numberOfLines={2}>{item.desc}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardLikes}>♡ {item.likes}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {items.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>没有找到相关内容</Text>
            <Text style={styles.emptyText}>换个关键词试试</Text>
          </View>
        )}

        {/* 热门话题 */}
        {!searchText.trim() && (
          <>
            <Text style={styles.hotTitle}>🔥 热门话题</Text>
            <View style={styles.hotTagRow}>
              {hotTags.map((tag) => (
                <TouchableOpacity key={tag} style={styles.hotTag}>
                  <Text style={styles.hotTagText}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  // 搜索栏
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111318',
    marginHorizontal: 16, marginVertical: 10,
    borderRadius: 24, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 0.5, borderColor: '#252930',
  },
  searchIcon: { fontSize: 15, marginRight: 8 },
  searchInput: { flex: 1, color: Colors.white, fontSize: 15 },
  clearBtn: { color: Colors.textMuted, fontSize: 16, paddingLeft: 8 },

  // 分类
  catScroll: { flexGrow: 0, borderBottomWidth: 0.5, borderBottomColor: '#1a1d22' },
  catContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  catPill: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, backgroundColor: '#111318',
    borderWidth: 0.5, borderColor: '#252930',
  },
  catPillActive: { backgroundColor: Colors.white },
  catPillText: { color: Colors.textMuted, fontSize: 13, fontWeight: '700' },
  catPillTextActive: { color: Colors.black },

  // 列表
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },

  card: {
    backgroundColor: '#0c0f14',
    borderRadius: 14, borderWidth: 0.5, borderColor: '#1e2330',
    padding: 14, gap: 6,
  },
  cardTitle: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  cardDesc: { color: Colors.textMuted, fontSize: 13, lineHeight: 20 },
  cardFooter: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  cardLikes: { color: Colors.textMuted, fontSize: 13 },
  emptyState: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 6 },
  emptyTitle: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  emptyText: { color: Colors.textMuted, fontSize: 13 },

  // 热门话题
  hotTitle: { color: Colors.white, fontSize: 15, fontWeight: '800', marginTop: 8, marginBottom: 4 },
  hotTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hotTag: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, backgroundColor: '#0f1a2e',
    borderWidth: 0.5, borderColor: '#1e3a5f',
  },
  hotTagText: { color: '#1d9bf0', fontSize: 13, fontWeight: '600' },
});
