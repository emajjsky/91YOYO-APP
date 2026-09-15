import React, { useState } from 'react';
import {
  View, Text, Image, TouchableOpacity,
  ScrollView, FlatList, StyleSheet, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = (SCREEN_W - 32 - 10) / 2;

type GearCategory = '悠悠球' | '线' | '配件' | '奖状' | '其他';
const GEAR_CATS: { id: GearCategory; emoji: string }[] = [
  { id: '悠悠球', emoji: '🪀' },
  { id: '线',    emoji: '🧵' },
  { id: '配件',  emoji: '🔩' },
  { id: '奖状',  emoji: '🏅' },
  { id: '其他',  emoji: '📦' },
];

interface IGearItem {
  id: string;
  name: string;
  category: GearCategory;
  imageUrl: string;
  weight?: string;
  material?: string;
  isPinned?: boolean;
  likes: number;
}

const MOCK_GEAR: IGearItem[] = [
  {
    id: 'g1', name: 'CLYW Chief 极光双金属',
    category: '悠悠球',
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&auto=format&fit=crop&q=80',
    weight: '65.8g', material: '铝合金 + 不锈钢', isPinned: true, likes: 38,
  },
  {
    id: 'g2', name: 'Turning Point E-Gen 钛合金',
    category: '悠悠球',
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=400&auto=format&fit=crop&q=80',
    weight: '64.2g', material: '纯钛一体', isPinned: true, likes: 61,
  },
  {
    id: 'g3', name: 'YYF 特制多色编绳线 ×10',
    category: '线',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&auto=format&fit=crop&q=80',
    material: '100% 聚酯纤维', likes: 5,
  },
  {
    id: 'g4', name: 'NSK 金色凹轴 ×3',
    category: '配件',
    imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80',
    material: '精密级钢', likes: 12,
  },
  {
    id: 'g5', name: 'CYSO 2025 上海站 季军奖状',
    category: '奖状',
    imageUrl: 'https://images.unsplash.com/photo-1567427018141-0584cfcbf1b8?w=400&auto=format&fit=crop&q=80',
    isPinned: false, likes: 147,
  },
];

export default function GearScreen() {
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState<GearCategory | 'all'>('all');

  const filtered = activeCategory === 'all'
    ? MOCK_GEAR
    : MOCK_GEAR.filter((g) => g.category === activeCategory);

  // 置顶排前
  const sorted = [...filtered].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 顶部导航 */}
      <View style={styles.navbar}>
        <Text style={styles.navTitle}>我的装备陈列室</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Text style={styles.addBtnText}>＋ 添加藏品</Text>
        </TouchableOpacity>
      </View>

      {/* 分类筛选 */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={styles.catScroll}
        contentContainerStyle={styles.catContent}
      >
        <TouchableOpacity
          style={[styles.catPill, activeCategory === 'all' && styles.catPillActive]}
          onPress={() => setActiveCategory('all')}
        >
          <Text style={[styles.catText, activeCategory === 'all' && styles.catTextActive]}>
            全部
          </Text>
        </TouchableOpacity>
        {GEAR_CATS.map((c) => {
          const active = activeCategory === c.id;
          return (
            <TouchableOpacity
              key={c.id}
              style={[styles.catPill, active && styles.catPillActive]}
              onPress={() => setActiveCategory(c.id)}
            >
              <Text style={[styles.catText, active && styles.catTextActive]}>
                {c.emoji} {c.id}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 九宫格 */}
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={(
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>暂无藏品</Text>
            <Text style={styles.emptyText}>这个分类还没有内容</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} activeOpacity={0.85}>
            <View style={styles.imgWrapper}>
              <Image source={{ uri: item.imageUrl }} style={styles.cardImage} resizeMode="cover" />
              {item.isPinned && (
                <View style={styles.pinBadge}>
                  <Text style={styles.pinText}>📌 置顶</Text>
                </View>
              )}
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
              {(item.weight || item.material) && (
                <Text style={styles.cardMeta} numberOfLines={1}>
                  {[item.weight, item.material].filter(Boolean).join(' · ')}
                </Text>
              )}
              <View style={styles.cardFooter}>
                <Text style={styles.catBadge}>
                  {GEAR_CATS.find((c) => c.id === item.category)?.emoji} {item.category}
                </Text>
                <Text style={styles.likeText}>♡ {item.likes}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
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
  addBtn: {},
  addBtnText: { color: Colors.white, fontSize: 13, fontWeight: '600' },

  catScroll: { flexGrow: 0, borderBottomWidth: 0.5, borderBottomColor: '#1a1d22' },
  catContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  catPill: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#111318', borderWidth: 0.5, borderColor: '#252930',
  },
  catPillActive: { backgroundColor: Colors.white },
  catText: { color: Colors.textMuted, fontSize: 13, fontWeight: '700' },
  catTextActive: { color: Colors.black },

  grid: { padding: 16, gap: 10 },
  row: { gap: 10 },
  emptyState: { minHeight: 240, alignItems: 'center', justifyContent: 'center', gap: 6 },
  emptyTitle: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  emptyText: { color: Colors.textMuted, fontSize: 13 },

  card: {
    width: CARD_W, backgroundColor: '#0c0f14',
    borderRadius: 14, overflow: 'hidden',
    borderWidth: 0.5, borderColor: '#1e2330',
  },
  imgWrapper: { width: '100%', aspectRatio: 1 },
  cardImage: { width: '100%', height: '100%' },
  pinBadge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
  },
  pinText: { color: Colors.white, fontSize: 10 },

  cardBody: { padding: 10, gap: 4 },
  cardName: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  cardMeta: { color: Colors.textMuted, fontSize: 11 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  catBadge: { color: '#8899bb', fontSize: 11 },
  likeText: { color: Colors.textMuted, fontSize: 11 },
});
