import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFeedStore } from '../../stores/feedStore';
import { Colors } from '../../constants/colors';
import { POST_CATEGORIES } from '../../constants/categories';
import { formatTimeAgoFromString } from '../../utils/timeAgo';
import type { IFeedItem } from '../../types/feed';

const { width: SCREEN_W } = Dimensions.get('window');
const TAB_ITEMS = ['为你推荐', '正在关注'] as const;
type FeedTab = typeof TAB_ITEMS[number];

// ─── 子组件：花式标签 ─────────────────────────────
function StyleTags({ tags, levelTag }: { tags: string[]; levelTag?: string }) {
  const displayTags = tags.slice(0, 3);
  const overflow = tags.length - 3;
  return (
    <View style={styles.styleTagRow}>
      {displayTags.map((t) => (
        <View key={t} style={styles.styleTag}>
          <Text style={styles.styleTagText}>{t}</Text>
        </View>
      ))}
      {overflow > 0 && (
        <View style={styles.styleTag}>
          <Text style={styles.styleTagText}>+{overflow}</Text>
        </View>
      )}
      {levelTag && (
        <View style={[styles.styleTag, styles.levelTag]}>
          <Text style={styles.levelTagText}>{levelTag}</Text>
        </View>
      )}
    </View>
  );
}

// ─── 子组件：分类标签 ─────────────────────────────
function CategoryTag({ categoryId }: { categoryId: string }) {
  const cat = POST_CATEGORIES.find((c) => c.id === categoryId);
  if (!cat) return null;
  return (
    <View style={styles.categoryTag}>
      <Text style={styles.categoryTagText}>{cat.emoji} {cat.label}</Text>
    </View>
  );
}

// ─── 子组件：九宫格图片 ───────────────────────────
function ImageGrid({ images }: { images: { url: string }[] }) {
  const count = images.length;
  if (count === 1) {
    return (
      <Image source={{ uri: images[0].url }} style={styles.singleImage} resizeMode="cover" />
    );
  }
  if (count === 2) {
    return (
      <View style={styles.twoGrid}>
        {images.map((img, i) => (
          <Image key={i} source={{ uri: img.url }} style={styles.twoGridItem} resizeMode="cover" />
        ))}
      </View>
    );
  }
  // 3-9 张：九宫格
  return (
    <View style={styles.nineGrid}>
      {images.slice(0, 9).map((img, i) => (
        <Image key={i} source={{ uri: img.url }} style={styles.nineGridItem} resizeMode="cover" />
      ))}
    </View>
  );
}

// ─── 子组件：视频卡 ───────────────────────────────
function VideoCard({ video }: { video: IFeedItem['video'] }) {
  if (!video) return null;
  return (
    <TouchableOpacity
      style={styles.videoCard}
      onPress={() => Alert.alert('播放视频', video.title)}
      activeOpacity={0.9}
    >
      <Image source={{ uri: video.posterUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <View style={styles.videoOverlay} />
      <View style={styles.playBtn}>
        <Text style={styles.playIcon}>▶</Text>
      </View>
      <Text style={styles.videoTitle} numberOfLines={1}>{video.title}</Text>
      {/* 慢放/镜像/下载：只在点击播放后展示，这里不渲染 */}
    </TouchableOpacity>
  );
}

// ─── 子组件：音频条 ───────────────────────────────
function AudioBar({ audio }: { audio: IFeedItem['audio'] }) {
  if (!audio) return null;
  return (
    <View style={styles.audioBar}>
      <View style={styles.audioInfo}>
        <Text style={styles.audioTitle} numberOfLines={2}>{audio.title}</Text>
        <Text style={styles.audioBpm}>BPM {audio.bpm} · {audio.durationText}</Text>
        {audio.tag && <Text style={styles.audioTagText}>{audio.tag}</Text>}
      </View>
      <TouchableOpacity style={styles.audioPlayBtn} onPress={() => Alert.alert('播放', audio.title)}>
        <Text style={styles.audioPlayIcon}>▶</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── 帖子卡片 ─────────────────────────────────────
function FeedCard({ item, onLike, onBookmark }: {
  item: IFeedItem;
  onLike: () => void;
  onBookmark: () => void;
}) {
  return (
    <View style={styles.card}>
      {/* 作者信息行 */}
      <View style={styles.authorRow}>
        <TouchableOpacity>
          {item.author.avatarUrl ? (
            <Image source={{ uri: item.author.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarFallbackText}>{item.author.nickname.slice(0, 1).toUpperCase()}</Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.authorMeta}>
          <View style={styles.authorNameRow}>
            <Text style={styles.nickname}>{item.author.nickname}</Text>
            <StyleTags tags={item.author.styleTags} levelTag={item.author.levelTag} />
          </View>
          <Text style={styles.timeText}>{formatTimeAgoFromString(item.createdAt)}</Text>
        </View>
        <TouchableOpacity style={styles.moreBtn}>
          <Text style={styles.moreDots}>···</Text>
        </TouchableOpacity>
      </View>

      {/* 分类标签 */}
      <CategoryTag categoryId={item.category} />

      {/* 正文 */}
      <Text style={styles.content}>{item.content}</Text>

      {/* Hashtag */}
      {item.tags.length > 0 && (
        <View style={styles.hashtagRow}>
          {item.tags.map((tag) => (
            <Text key={tag} style={styles.hashtag}>{tag} </Text>
          ))}
        </View>
      )}

      {/* 媒体 */}
      {item.video && <VideoCard video={item.video} />}
      {item.images && item.images.length > 0 && <ImageGrid images={item.images} />}
      {item.audio && <AudioBar audio={item.audio} />}

      {/* 互动栏 */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionCount}>{item.commentCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionIcon}>↗</Text>
          <Text style={styles.actionCount}>{item.shareCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={onLike}>
          <Text style={[styles.actionIcon, item.isLiked && styles.liked]}>
            {item.isLiked ? '♥' : '♡'}
          </Text>
          <Text style={[styles.actionCount, item.isLiked && styles.liked]}>
            {item.likeCount}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={onBookmark}>
          <Text style={styles.actionIcon}>{item.isBookmarked ? '🔖' : '🏷'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── 主页面 ───────────────────────────────────────
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<FeedTab>('为你推荐');
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const { feedList, loadState, errorMessage, hasMore, loadFeed, loadMore, toggleLike, toggleBookmark } = useFeedStore();

  useEffect(() => {
    void loadFeed(activeTab === '为你推荐' ? 'public' : 'following');
  }, [activeTab, loadFeed]);

  const handleTabPress = (tab: FeedTab, idx: number) => {
    setActiveTab(tab);
    Animated.spring(indicatorAnim, {
      toValue: idx,
      useNativeDriver: true,
      tension: 120,
      friction: 10,
    }).start();
  };

  const TAB_W = SCREEN_W / 2;
  const indicatorX = indicatorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [TAB_W / 2 - 20, TAB_W + TAB_W / 2 - 20],
  });

  const renderItem = useCallback(({ item }: { item: IFeedItem }) => (
    <FeedCard
      item={item}
      onLike={() => toggleLike(item.id)}
      onBookmark={() => toggleBookmark(item.id)}
    />
  ), [toggleLike, toggleBookmark]);

  const handleRefresh = () => {
    void loadFeed(activeTab === '为你推荐' ? 'public' : 'following', true);
  };

  const handleEndReached = () => {
    if (hasMore && loadState === 'success') void loadMore();
  };

  const renderFooter = () => {
    if (loadState === 'loading_more') return <ActivityIndicator color={Colors.textMuted} style={styles.footer} />;
    if (loadState === 'error' && feedList.length > 0) {
      return (
        <TouchableOpacity onPress={() => void loadMore()} style={styles.footerButton}>
          <Text style={styles.footerText}>加载失败，点击重试</Text>
        </TouchableOpacity>
      );
    }
    if (loadState === 'success' && !hasMore && feedList.length > 0) return <Text style={styles.footerText}>已经到底了</Text>;
    return null;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 顶部双 Tab */}
      <View style={styles.tabBar}>
        {TAB_ITEMS.map((tab, idx) => (
          <TouchableOpacity
            key={tab}
            style={styles.tabItem}
            onPress={() => handleTabPress(tab, idx)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
        {/* 滑动指示线 */}
        <Animated.View
          style={[styles.tabIndicator, { transform: [{ translateX: indicatorX }] }]}
        />
      </View>

      {/* 信息流 */}
      <FlatList
        data={feedList}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          loadState === 'loading' || loadState === 'refreshing'
            ? <ActivityIndicator color={Colors.textMuted} style={styles.emptyState} />
            : <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>{errorMessage ? '加载失败' : '还没有动态'}</Text>
                <Text style={styles.emptyText}>{errorMessage ?? '成为第一个分享练习的人吧。'}</Text>
                {errorMessage && <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}><Text style={styles.retryText}>重新加载</Text></TouchableOpacity>}
              </View>
        }
        ListFooterComponent={renderFooter}
        refreshControl={<RefreshControl refreshing={loadState === 'refreshing'} onRefresh={handleRefresh} tintColor={Colors.white} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
      />
    </View>
  );
}

// ─── 样式 ─────────────────────────────────────────
const GRID_GAP = 3;
const GRID_ITEM_W = (SCREEN_W - 32 - GRID_GAP * 2) / 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  // ── TabBar ──
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#1a1d22',
    position: 'relative',
  },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 13 },
  tabText: { color: Colors.textMuted, fontSize: 16, fontWeight: '600' },
  tabTextActive: { color: Colors.white, fontWeight: '800' },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 40,
    height: 2.5,
    backgroundColor: Colors.white,
    borderRadius: 2,
  },

  // ── 列表 ──
  listContent: { paddingBottom: 24 },
  divider: { height: 0.5, backgroundColor: '#1a1d22', marginHorizontal: 16 },
  emptyState: { minHeight: 220, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 8 },
  emptyTitle: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  emptyText: { color: Colors.textMuted, fontSize: 13, textAlign: 'center' },
  retryButton: { backgroundColor: Colors.white, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8, marginTop: 8 },
  retryText: { color: Colors.black, fontSize: 13, fontWeight: '700' },
  footer: { paddingVertical: 16 },
  footerButton: { alignItems: 'center', paddingVertical: 16 },
  footerText: { color: Colors.textMuted, fontSize: 12, textAlign: 'center', paddingVertical: 16 },

  // ── 卡片 ──
  card: { paddingHorizontal: 16, paddingVertical: 14, gap: 10 },

  // ── 作者行 ──
  authorRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1.5, borderColor: '#2a2d33',
  },
  avatarFallback: { backgroundColor: '#16181c', alignItems: 'center', justifyContent: 'center' },
  avatarFallbackText: { color: Colors.textSecondary, fontSize: 17, fontWeight: '800' },
  authorMeta: { flex: 1 },
  authorNameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  nickname: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  timeText: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  moreBtn: { paddingLeft: 8, paddingTop: 2 },
  moreDots: { color: Colors.textMuted, fontSize: 18, letterSpacing: 1 },

  // ── 花式标签 ──
  styleTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  styleTag: {
    backgroundColor: '#1c2028',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 0.5,
    borderColor: '#2e3340',
  },
  styleTagText: { color: '#8899bb', fontSize: 11, fontWeight: '700' },
  levelTag: { backgroundColor: '#0f1a2e', borderColor: '#1e3a5f' },
  levelTagText: { color: '#67aaff', fontSize: 11, fontWeight: '700' },

  // ── 分类标签 ──
  categoryTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#111518',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 0.5,
    borderColor: '#252930',
  },
  categoryTagText: { color: Colors.textMuted, fontSize: 12 },

  // ── 正文 ──
  content: { color: Colors.textPrimary, fontSize: 15, lineHeight: 22 },
  hashtagRow: { flexDirection: 'row', flexWrap: 'wrap' },
  hashtag: { color: '#1d9bf0', fontSize: 14 },

  // ── 视频 ──
  videoCard: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  playBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)',
  },
  playIcon: { color: '#fff', fontSize: 20, marginLeft: 3 },
  videoTitle: {
    position: 'absolute', bottom: 10, left: 12, right: 12,
    color: 'rgba(255,255,255,0.75)', fontSize: 12,
  },

  // ── 图片 ──
  singleImage: { width: '100%', aspectRatio: 4 / 3, borderRadius: 14 },
  twoGrid: { flexDirection: 'row', gap: GRID_GAP },
  twoGridItem: { flex: 1, aspectRatio: 1, borderRadius: 10 },
  nineGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
  nineGridItem: { width: GRID_ITEM_W, height: GRID_ITEM_W, borderRadius: 8 },

  // ── 音频条 ──
  audioBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0e1117',
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: '#1e2330',
    padding: 12,
    gap: 10,
  },
  audioInfo: { flex: 1 },
  audioTitle: { color: Colors.textPrimary, fontSize: 13, fontWeight: '600' },
  audioBpm: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  audioTagText: { color: Colors.textSecondary, fontSize: 11, marginTop: 4 },
  audioPlayBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.white,
    justifyContent: 'center', alignItems: 'center',
  },
  audioPlayIcon: { color: Colors.black, fontSize: 14, fontWeight: '800', marginLeft: 2 },

  // ── 互动栏 ──
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4 },
  actionIcon: { color: Colors.textMuted, fontSize: 18 },
  actionCount: { color: Colors.textMuted, fontSize: 13 },
  liked: { color: '#F91880' },
});
