import React, { useCallback, useEffect, useMemo } from 'react';
import {
  FlatList,
  Image,
  type ImageSourcePropType,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MapPin, Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FeedPost from '../../features/feed/FeedPost';
import FeedState from '../../features/feed/FeedState';
import { currentViewer } from '../../features/social/mockProfiles';
import { mockUsers } from '../../features/social/mockUsers';
import { useSocialStore } from '../../features/social/socialStore';
import type { SocialPost } from '../../features/social/types';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { postsForUser } from './profileModel';
import { useTheme } from '../../theme/ThemeProvider';

const viewer = mockUsers.find((user) => user.id === currentViewer.userId)!;

function imageSource(uri: number | string): ImageSourcePropType {
  return typeof uri === 'number' ? uri : { uri };
}

export default function ProfileScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const state = useSocialStore();
  const posts = useMemo(
    () => postsForUser(Object.values(state.postsById), viewer.id),
    [state.postsById],
  );
  const likeCount = posts.reduce((total, post) => total + post.likeCount, 0);

  const loadAllPosts = useCallback(async () => {
    await useSocialStore.getState().loadFeed('recommended');
    while (true) {
      const feed = useSocialStore.getState().feeds.recommended;
      if (!feed.hasMore || feed.loadState === 'error') return;
      await useSocialStore.getState().loadMore('recommended');
    }
  }, []);

  useEffect(() => {
    void loadAllPosts();
  }, [loadAllPosts]);

  const sharePost = async (post: SocialPost) => {
    await Share.share({ message: `${viewer.displayName}：${post.content}` });
  };

  const header = (
    <View>
      <View style={styles.profileHeader}>
        <Image source={imageSource(viewer.avatarUri)} style={styles.avatar} />
        <View style={styles.identity}>
          <Text numberOfLines={1} style={styles.displayName}>{viewer.displayName}</Text>
          <Text numberOfLines={1} style={styles.handle}>@{viewer.handle}</Text>
        </View>
      </View>

      <View style={styles.profileCopy}>
        <Text style={styles.bio}>{viewer.bio}</Text>
        <View style={styles.locationRow}>
          <MapPin color={colors.textMuted} size={15} strokeWidth={2} />
          <Text style={styles.location}>{viewer.city}</Text>
        </View>
        <View style={styles.styleRow}>
          {viewer.styleTags.map((tag) => <Text key={tag} style={styles.styleTag}>{tag}</Text>)}
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{state.followedUserIds.length}</Text>
          <Text style={styles.statLabel}>关注</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{posts.length}</Text>
          <Text style={styles.statLabel}>动态</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{likeCount.toLocaleString('zh-CN')}</Text>
          <Text style={styles.statLabel}>获赞</Text>
        </View>
      </View>

      <View style={styles.feedHeading}>
        <Text style={styles.feedHeadingText}>动态</Text>
        <View style={styles.feedIndicator} />
      </View>
    </View>
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.navbar}>
        <Text style={styles.navTitle}>我的</Text>
        <Pressable
          accessibilityLabel="账户设置"
          accessibilityRole="button"
          onPress={() => navigation.navigate('AccountSettings')}
          style={styles.settingsButton}
        >
          <Settings color={colors.textPrimary} size={22} strokeWidth={2} />
        </Pressable>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(post) => post.id}
        ListHeaderComponent={header}
        ListEmptyComponent={state.feeds.recommended.loadState === 'loading'
          ? <FeedState kind="loading" message="正在加载动态" />
          : <FeedState kind="empty" message="发布第一条动态，记录你的悠悠球生活" />}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        renderItem={({ item: post }) => (
          <FeedPost
            post={post}
            author={viewer}
            isLiked={state.likedPostIds.includes(post.id)}
            isBookmarked={state.bookmarkedPostIds.includes(post.id)}
            onOpen={() => navigation.navigate('PostDetail', { postId: post.id })}
            onOpenMedia={() => post.media.type === 'video'
              ? navigation.navigate('VideoFeed', { initialPostId: post.id })
              : navigation.navigate('PostDetail', { postId: post.id })}
            onOpenAuthor={() => undefined}
            onLike={() => state.toggleLike(post.id)}
            onBookmark={() => state.toggleBookmark(post.id)}
            onComment={() => navigation.navigate('PostDetail', { postId: post.id })}
            onShare={() => void sharePost(post)}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function createStyles(colors: { background: string; surface: string; border: string; textPrimary: string; textMuted: string; brand: string }) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  navbar: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  navTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '900' },
  settingsButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingTop: 18 },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.brand },
  identity: { flex: 1, minWidth: 0 },
  displayName: { color: colors.textPrimary, fontSize: 21, fontWeight: '900' },
  handle: { color: colors.textMuted, fontSize: 14, marginTop: 3 },
  profileCopy: { gap: 10, paddingHorizontal: 16, paddingTop: 14 },
  bio: { color: colors.textPrimary, fontSize: 15, lineHeight: 21 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  location: { color: colors.textMuted, fontSize: 13 },
  styleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  styleTag: { color: colors.brand, fontSize: 13, fontWeight: '700' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 17 },
  statItem: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginRight: 22 },
  statValue: { color: colors.textPrimary, fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'] },
  statLabel: { color: colors.textMuted, fontSize: 13 },
  feedHeading: { height: 46, alignItems: 'center', justifyContent: 'flex-end', borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  feedHeadingText: { color: colors.textPrimary, fontSize: 14, fontWeight: '800', paddingBottom: 11 },
  feedIndicator: { width: 54, height: 3, borderRadius: 2, backgroundColor: colors.brand },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  });
}
