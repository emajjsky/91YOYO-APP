import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Pressable } from 'react-native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import FeedPost from '../../features/feed/FeedPost';
import FeedState from '../../features/feed/FeedState';
import type { FeedMode } from '../../features/social/contentRepository';
import { useSocialStore } from '../../features/social/socialStore';
import type { SocialPost } from '../../features/social/types';
import type { MainTabParamList } from '../../navigation/MainTabNavigator';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type HomeNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const MODES: { mode: FeedMode; label: string }[] = [
  { mode: 'recommended', label: '推荐' },
  { mode: 'following', label: '关注' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<HomeNavigation>();
  const [activeMode, setActiveMode] = useState<FeedMode>('recommended');
  const listRefs = useRef<Record<FeedMode, FlatList<string> | null>>({ recommended: null, following: null });
  const offsets = useRef<Record<FeedMode, number>>({ recommended: 0, following: 0 });
  const state = useSocialStore();

  useEffect(() => {
    void state.loadFeed('recommended');
    void state.loadFeed('following');
  }, [state.loadFeed]);

  const selectMode = (mode: FeedMode) => {
    setActiveMode(mode);
    requestAnimationFrame(() => {
      listRefs.current[mode]?.scrollToOffset({ offset: offsets.current[mode], animated: false });
    });
  };

  const sharePost = async (post: SocialPost) => {
    const author = state.usersById[post.authorId];
    await Share.share({ message: `${author?.displayName ?? '91YOYO 球友'}：${post.content}` });
  };

  const renderPost = useCallback((mode: FeedMode, postId: string) => {
    const post = state.postsById[postId];
    const author = post ? state.usersById[post.authorId] : undefined;
    if (!post || !author) return null;

    return (
      <FeedPost
        post={post}
        author={author}
        recommendationReason={mode === 'recommended' ? state.recommendationReasonsByPostId[post.id] : null}
        isLiked={state.likedPostIds.includes(post.id)}
        isBookmarked={state.bookmarkedPostIds.includes(post.id)}
        onOpen={() => navigation.navigate('PostDetail', { postId: post.id })}
        onOpenAuthor={() => navigation.navigate('UserProfile', { userId: author.id })}
        onLike={() => state.toggleLike(post.id)}
        onBookmark={() => state.toggleBookmark(post.id)}
        onComment={() => navigation.navigate('PostDetail', { postId: post.id })}
        onShare={() => void sharePost(post)}
      />
    );
  }, [navigation, state]);

  const emptyState = (mode: FeedMode) => {
    const feed = state.feeds[mode];
    if (feed.loadState === 'loading' || feed.loadState === 'idle') {
      return <FeedState kind="loading" message={mode === 'recommended' ? '正在整理适合你的内容' : '正在加载关注动态'} />;
    }
    if (feed.loadState === 'error') {
      return <FeedState kind="error" title="加载失败" message={feed.errorMessage ?? '请稍后重试'} actionLabel="重新加载" onAction={() => void state.loadFeed(mode, true)} />;
    }
    if (mode === 'following') {
      return <FeedState kind="empty" message="关注喜欢的球手后，他们的新动态会出现在这里" actionLabel="去探索" onAction={() => navigation.navigate('Explore')} />;
    }
    return <FeedState kind="empty" message="正在整理适合你的内容" actionLabel="刷新" onAction={() => void state.loadFeed(mode, true)} />;
  };

  const footer = (mode: FeedMode) => {
    const feed = state.feeds[mode];
    if (feed.loadState === 'loading_more') {
      return <ActivityIndicator color={Colors.brand} style={styles.footer} />;
    }
    if (feed.loadState === 'error' && feed.ids.length > 0) {
      return (
        <Pressable accessibilityRole="button" onPress={() => void state.loadMore(mode)} style={styles.footerButton}>
          <Text style={styles.footerText}>加载失败，点击重试</Text>
        </Pressable>
      );
    }
    return <View style={styles.footerSpacer} />;
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Text style={styles.wordmark}>91YOYO</Text>
      </View>
      <View style={styles.tabs}>
        {MODES.map(({ mode, label }) => {
          const active = activeMode === mode;
          return (
            <Pressable
              key={mode}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => selectMode(mode)}
              style={styles.tab}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
              <View style={[styles.indicator, active && styles.indicatorActive]} />
            </Pressable>
          );
        })}
      </View>
      <View style={styles.feedArea}>
        {MODES.map(({ mode }) => {
          const feed = state.feeds[mode];
          const active = activeMode === mode;
          return (
            <View key={mode} pointerEvents={active ? 'auto' : 'none'} style={[styles.listLayer, !active && styles.listLayerHidden]}>
              <FlatList
                ref={(ref) => { listRefs.current[mode] = ref; }}
                data={feed.ids}
                keyExtractor={(postId) => postId}
                renderItem={({ item }) => renderPost(mode, item)}
                ItemSeparatorComponent={() => <View style={styles.divider} />}
                ListEmptyComponent={emptyState(mode)}
                ListFooterComponent={footer(mode)}
                refreshControl={
                  <RefreshControl
                    refreshing={feed.loadState === 'refreshing'}
                    onRefresh={() => void state.loadFeed(mode, true)}
                    tintColor={Colors.brand}
                  />
                }
                onScroll={(event) => { offsets.current[mode] = event.nativeEvent.contentOffset.y; }}
                scrollEventThrottle={16}
                onEndReached={() => {
                  if (active && feed.loadState === 'success' && feed.hasMore) void state.loadMore(mode);
                }}
                onEndReachedThreshold={0.45}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={feed.ids.length === 0 ? styles.emptyList : styles.listContent}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  topBar: { height: 44, justifyContent: 'center', paddingHorizontal: 16 },
  wordmark: { color: Colors.textPrimary, fontSize: 18, fontWeight: '900' },
  tabs: { height: 48, flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  tab: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'flex-end' },
  tabText: { color: Colors.textMuted, fontSize: 15, fontWeight: '600', paddingBottom: 10 },
  tabTextActive: { color: Colors.textPrimary, fontWeight: '800' },
  indicator: { width: 48, height: 2, backgroundColor: 'transparent' },
  indicatorActive: { backgroundColor: Colors.brand },
  feedArea: { flex: 1, position: 'relative' },
  listLayer: { ...StyleSheet.absoluteFill, backgroundColor: Colors.background },
  listLayerHidden: { opacity: 0 },
  listContent: { paddingBottom: 18 },
  emptyList: { flexGrow: 1 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border },
  footer: { paddingVertical: 18 },
  footerButton: { minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  footerText: { color: Colors.brand, fontSize: 13, fontWeight: '600' },
  footerSpacer: { height: 12 },
});
