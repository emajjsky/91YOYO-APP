import React, { useState } from 'react';
import {
  View, Text, Image, type ImageSourcePropType, Pressable,
  ScrollView, FlatList, StyleSheet, Dimensions,
} from 'react-native';
import { Plus } from 'lucide-react-native';
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
  imageUri: number | string;
  weight?: string;
  material?: string;
  isPinned?: boolean;
  likes: number;
}

const MOCK_GEAR: IGearItem[] = [
  {
    id: 'g1', name: '蓝色日常练习球',
    category: '悠悠球',
    imageUri: require('../../../assets/mock/social/yoyo-blue.jpg') as number,
    material: '塑料', isPinned: true, likes: 38,
  },
  {
    id: 'g2', name: '备用轴承与回收系统',
    category: '配件',
    imageUri: require('../../../assets/mock/social/yoyo-bearing.jpg') as number,
    material: '金属轴承', likes: 12,
  },
];

function imageSource(uri: number | string): ImageSourcePropType {
  return typeof uri === 'number' ? uri : { uri };
}

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
        <Pressable accessibilityRole="button" style={styles.addBtn}>
          <Plus color={Colors.textPrimary} size={17} strokeWidth={2.2} />
          <Text style={styles.addBtnText}>添加藏品</Text>
        </Pressable>
      </View>

      {/* 分类筛选 */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={styles.catScroll}
        contentContainerStyle={styles.catContent}
      >
        <Pressable
          style={[styles.catPill, activeCategory === 'all' && styles.catPillActive]}
          onPress={() => setActiveCategory('all')}
        >
          <Text style={[styles.catText, activeCategory === 'all' && styles.catTextActive]}>
            全部
          </Text>
        </Pressable>
        {GEAR_CATS.map((c) => {
          const active = activeCategory === c.id;
          return (
            <Pressable
              key={c.id}
              style={[styles.catPill, active && styles.catPillActive]}
              onPress={() => setActiveCategory(c.id)}
            >
              <Text style={[styles.catText, active && styles.catTextActive]}>
                {c.emoji} {c.id}
              </Text>
            </Pressable>
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
          <Pressable style={styles.card}>
            <View style={styles.imgWrapper}>
              <Image source={imageSource(item.imageUri)} style={styles.cardImage} resizeMode="cover" />
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
          </Pressable>
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
  addBtn: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 5 },
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
    borderRadius: 8, overflow: 'hidden',
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
