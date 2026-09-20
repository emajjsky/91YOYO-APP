import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  type ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Heart, ImageIcon, Music2, Play, Search, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { POST_CATEGORIES } from '../../constants/categories';
import { Colors } from '../../constants/colors';
import FeedState from '../../features/feed/FeedState';
import { useSocialStore } from '../../features/social/socialStore';
import type { MediaContent, SocialPost } from '../../features/social/types';
import type { MainTabParamList } from '../../navigation/MainTabNavigator';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import {
  getTrendingTopics,
  partitionExploreResults,
  rankExplorePosts,
  type ExploreCategoryId,
  type ExploreResult,
} from './exploreSearch';

type ExploreNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Explore'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const DISCOVERY_NOW = '2026-09-20T12:00:00.000Z';
const CATEGORIES: { id: ExploreCategoryId; label: string }[] = [
  { id: 'all', label: '全部' },
  ...POST_CATEGORIES.map(({ id, label }) => ({ id, label })),
];

function imageSource(uri: number | string): ImageSourcePropType {
  return typeof uri === 'number' ? uri : { uri };
}

function mediaPreview(media: MediaContent): ImageSourcePropType | null {
  switch (media.type) {
    case 'images': return media.assets[0] ? imageSource(media.assets[0].uri) : null;
    case 'video': return imageSource(media.asset.posterUri);
    case 'audio': return imageSource(media.asset.coverUri);
    default: return null;
  }
}

function compactCount(value: number): string {
  if (value >= 10_000) return `${Math.round(value / 10_000)}万`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(value);
}

function MediaBadge({ media }: { media: MediaContent }) {
  if (media.type === 'video') return <Play color={Colors.textPrimary} fill={Colors.textPrimary} size={16} strokeWidth={1.8} />;
  if (media.type === 'audio') return <Music2 color={Colors.textPrimary} size={16} strokeWidth={2} />;
  if (media.type === 'images') return <ImageIcon color={Colors.textPrimary} size={16} strokeWidth={2} />;
  return null;
}

function MediaCard({ result, width, onPress }: {
  result: ExploreResult;
  width: number;
  onPress(): void;
}) {
  const source = mediaPreview(result.post.media);
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.mediaCard, { width }]}>
      <View style={styles.preview}>
        {source ? <Image source={source} resizeMode="cover" style={StyleSheet.absoluteFill} /> : null}
        <View style={styles.previewShade} />
        <View style={styles.mediaBadge}><MediaBadge media={result.post.media} /></View>
      </View>
      <Text numberOfLines={2} style={styles.mediaContent}>{result.post.content}</Text>
      <View style={styles.mediaMeta}>
        <Text numberOfLines={1} style={styles.authorName}>@{result.author.handle}</Text>
        <View style={styles.likeMeta}>
          <Heart color={Colors.textMuted} size={13} strokeWidth={2} />
          <Text style={styles.metaText}>{compactCount(result.post.likeCount)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function TextResult({ result, onPress }: { result: ExploreResult; onPress(): void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.textResult}>
      <View style={styles.textResultHeader}>
        <Text numberOfLines={1} style={styles.textAuthor}>{result.author.displayName}</Text>
        <Text numberOfLines={1} style={styles.textHandle}>@{result.author.handle}</Text>
      </View>
      <Text numberOfLines={3} style={styles.textContent}>{result.post.content}</Text>
      {result.post.hashtags.length > 0 ? (
        <Text numberOfLines={1} style={styles.textHashtags}>{result.post.hashtags.join(' ')}</Text>
      ) : null}
    </Pressable>
  );
}

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const navigation = useNavigation<ExploreNavigation>();
  const state = useSocialStore();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ExploreCategoryId>('all');
  const mediaCardWidth = Math.max(140, (windowWidth - 40) / 2);

  const loadAllPosts = useCallback(async (refresh = false) => {
    await useSocialStore.getState().loadFeed('recommended', refresh);
    while (true) {
      const currentFeed = useSocialStore.getState().feeds.recommended;
      if (!currentFeed.hasMore || currentFeed.loadState === 'error') return;
      await useSocialStore.getState().loadMore('recommended');
    }
  }, []);

  useEffect(() => {
    void loadAllPosts();
  }, [loadAllPosts]);

  const posts = useMemo(() => Object.values(state.postsById), [state.postsById]);
  const users = useMemo(() => Object.values(state.usersById), [state.usersById]);
  const ranked = useMemo(() => rankExplorePosts({
    posts,
    users,
    category: activeCategory,
    query,
    now: DISCOVERY_NOW,
  }), [activeCategory, posts, query, users]);
  const partitioned = useMemo(() => partitionExploreResults(ranked), [ranked]);
  const topics = useMemo(
    () => getTrendingTopics(posts, activeCategory, 8),
    [activeCategory, posts],
  );
  const feed = state.feeds.recommended;

  const openPost = (post: SocialPost) => {
    if (post.media.type === 'video') {
      navigation.navigate('VideoFeed', { initialPostId: post.id });
      return;
    }
    navigation.navigate('PostDetail', { postId: post.id });
  };

  const content = () => {
    if (feed.ids.length === 0 && (feed.loadState === 'idle' || feed.loadState === 'loading')) {
      return <FeedState kind="loading" message="正在整理发现内容" />;
    }
    if (feed.ids.length === 0 && feed.loadState === 'error') {
      return <FeedState kind="error" title="加载失败" message={feed.errorMessage ?? '请稍后重试'} actionLabel="重新加载" onAction={() => void loadAllPosts(true)} />;
    }
    if (ranked.length === 0) {
      return <FeedState kind="empty" title="没有找到相关内容" message="换个关键词或分类试试" actionLabel="清除筛选" onAction={() => { setQuery(''); setActiveCategory('all'); }} />;
    }

    return (
      <>
        {!query.trim() && topics.length > 0 ? (
          <View style={styles.topicSection}>
            <Text style={styles.sectionTitle}>热门话题</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topicRow}>
              {topics.map((topic) => (
                <Pressable key={topic.label} accessibilityRole="button" onPress={() => setQuery(topic.label)} style={styles.topicButton}>
                  <Text style={styles.topicLabel}>{topic.label}</Text>
                  <Text style={styles.topicCount}>{topic.count}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {partitioned.media.length > 0 ? (
          <View style={styles.resultSection}>
            <Text style={styles.sectionTitle}>内容发现</Text>
            <View style={styles.mediaGrid}>
              {partitioned.media.map((result) => (
                <MediaCard key={result.post.id} result={result} width={mediaCardWidth} onPress={() => openPost(result.post)} />
              ))}
            </View>
          </View>
        ) : null}

        {partitioned.text.length > 0 ? (
          <View style={styles.textSection}>
            <Text style={styles.sectionTitle}>动态</Text>
            {partitioned.text.map((result) => (
              <TextResult key={result.post.id} result={result} onPress={() => openPost(result.post)} />
            ))}
          </View>
        ) : null}

        {feed.loadState === 'loading_more' ? <ActivityIndicator color={Colors.brand} style={styles.loadingMore} /> : null}
        {feed.loadState === 'error' ? (
          <Pressable accessibilityRole="button" onPress={() => void loadAllPosts()} style={styles.retryButton}>
            <Text style={styles.retryText}>加载失败，点击重试</Text>
          </Pressable>
        ) : null}
      </>
    );
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.searchBar}>
        <Search color={Colors.textMuted} size={19} strokeWidth={2} />
        <TextInput
          accessibilityLabel="搜索用户、帖子或话题"
          autoCapitalize="none"
          onChangeText={setQuery}
          placeholder="搜索用户、帖子或话题"
          placeholderTextColor={Colors.textMuted}
          returnKeyType="search"
          style={styles.searchInput}
          value={query}
        />
        {query.length > 0 ? (
          <Pressable accessibilityLabel="清除搜索" accessibilityRole="button" hitSlop={8} onPress={() => setQuery('')} style={styles.clearButton}>
            <X color={Colors.textMuted} size={18} strokeWidth={2} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryBar} contentContainerStyle={styles.categoryContent}>
        {CATEGORIES.map((category) => {
          const active = activeCategory === category.id;
          return (
            <Pressable key={category.id} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => setActiveCategory(category.id)} style={styles.categoryTab}>
              <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>{category.label}</Text>
              <View style={[styles.categoryIndicator, active && styles.categoryIndicatorActive]} />
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.results} contentContainerStyle={styles.resultsContent}>
        {content()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  searchBar: { height: 44, flexDirection: 'row', alignItems: 'center', gap: 9, marginHorizontal: 14, marginTop: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: Colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border },
  searchInput: { flex: 1, height: 42, color: Colors.textPrimary, fontSize: 15, paddingVertical: 0 },
  clearButton: { width: 32, height: 40, alignItems: 'center', justifyContent: 'center' },
  categoryBar: { flexGrow: 0, height: 46, marginTop: 4, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  categoryContent: { paddingHorizontal: 8 },
  categoryTab: { height: 45, minWidth: 66, paddingHorizontal: 9, alignItems: 'center', justifyContent: 'flex-end' },
  categoryLabel: { color: Colors.textMuted, fontSize: 13, fontWeight: '600', paddingBottom: 9 },
  categoryLabelActive: { color: Colors.textPrimary, fontWeight: '800' },
  categoryIndicator: { width: 28, height: 2, backgroundColor: 'transparent' },
  categoryIndicatorActive: { backgroundColor: Colors.brand },
  results: { flex: 1 },
  resultsContent: { paddingTop: 14, paddingBottom: 28 },
  topicSection: { marginBottom: 18 },
  sectionTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: '800', marginHorizontal: 16, marginBottom: 10 },
  topicRow: { paddingHorizontal: 16, gap: 8 },
  topicButton: { height: 34, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 10, borderRadius: 6, backgroundColor: Colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border },
  topicLabel: { color: Colors.brand, fontSize: 13, fontWeight: '700' },
  topicCount: { color: Colors.textMuted, fontSize: 11 },
  resultSection: { marginBottom: 22 },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16 },
  mediaCard: { overflow: 'hidden', borderRadius: 6, backgroundColor: Colors.surface },
  preview: { width: '100%', aspectRatio: 1, backgroundColor: Colors.surface, overflow: 'hidden' },
  previewShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(9, 11, 13, 0.12)' },
  mediaBadge: { position: 'absolute', right: 8, top: 8, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(9, 11, 13, 0.72)' },
  mediaContent: { minHeight: 48, color: Colors.textPrimary, fontSize: 13, lineHeight: 18, fontWeight: '600', paddingHorizontal: 9, paddingTop: 8 },
  mediaMeta: { height: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, paddingHorizontal: 9 },
  authorName: { flex: 1, color: Colors.textMuted, fontSize: 11 },
  likeMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { color: Colors.textMuted, fontSize: 11 },
  textSection: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border, paddingTop: 16 },
  textResult: { minHeight: 108, paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  textResultHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  textAuthor: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },
  textHandle: { flex: 1, color: Colors.textMuted, fontSize: 12 },
  textContent: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 6 },
  textHashtags: { color: Colors.brand, fontSize: 12, marginTop: 6 },
  loadingMore: { paddingVertical: 20 },
  retryButton: { minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  retryText: { color: Colors.brand, fontSize: 13, fontWeight: '700' },
});
