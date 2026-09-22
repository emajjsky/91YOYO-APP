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
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronLeft, MapPin, MessageCircle } from 'lucide-react-native';
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

type Props = NativeStackScreenProps<RootStackParamList, 'UserProfile'>;

function imageSource(uri: number | string): ImageSourcePropType {
  return typeof uri === 'number' ? uri : { uri };
}

export default function UserProfileScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();
  const state = useSocialStore();
  const userId = route.params.userId;
  const user = state.usersById[userId] ?? mockUsers.find((candidate) => candidate.id === userId);
  const posts = useMemo(
    () => postsForUser(Object.values(state.postsById), userId),
    [state.postsById, userId],
  );
  const isFollowing = state.followedUserIds.includes(userId);
  const isCurrentUser = userId === currentViewer.userId;
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
    if (!user) return;
    await Share.share({ message: `${user.displayName}：${post.content}` });
  };

  if (!user) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.navbar}>
          <Pressable accessibilityLabel="返回" accessibilityRole="button" onPress={navigation.goBack} style={styles.navButton}>
            <ChevronLeft color={colors.textPrimary} size={27} strokeWidth={2} />
          </Pressable>
          <Text style={styles.navTitle}>个人主页</Text>
          <View style={styles.navButton} />
        </View>
        <FeedState kind="empty" title="用户不可用" message="该用户可能已离开，或资料尚未加载。" />
      </View>
    );
  }

  const header = (
    <View>
      <View style={styles.profileHeader}>
        <Image source={imageSource(user.avatarUri)} style={styles.avatar} />
        <View style={styles.identity}>
          <Text numberOfLines={1} style={styles.displayName}>{user.displayName}</Text>
          <Text numberOfLines={1} style={styles.handle}>@{user.handle}</Text>
        </View>
      </View>

      <View style={styles.profileCopy}>
        <Text style={styles.bio}>{user.bio}</Text>
        <View style={styles.locationRow}>
          <MapPin color={colors.textMuted} size={15} strokeWidth={2} />
          <Text style={styles.location}>{user.city}</Text>
        </View>
        <View style={styles.styleRow}>
          {user.styleTags.map((tag) => <Text key={tag} style={styles.styleTag}>{tag}</Text>)}
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{posts.length}</Text>
          <Text style={styles.statLabel}>动态</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{likeCount.toLocaleString('zh-CN')}</Text>
          <Text style={styles.statLabel}>获赞</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user.styleTags.length}</Text>
          <Text style={styles.statLabel}>花式</Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        {isCurrentUser ? (
          <Pressable accessibilityRole="button" onPress={() => navigation.navigate('AccountSettings')} style={styles.messageButton}>
            <Text style={styles.messageText}>编辑资料</Text>
          </Pressable>
        ) : (
          <>
            <Pressable
              accessibilityLabel={isFollowing ? `取消关注${user.displayName}` : `关注${user.displayName}`}
              accessibilityRole="button"
              onPress={() => state.toggleFollow(user.id)}
              style={[styles.followButton, isFollowing && styles.followingButton]}
            >
              <Text style={[styles.followText, isFollowing && styles.followingText]}>{isFollowing ? '已关注' : '关注'}</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={`私信${user.displayName}`}
              accessibilityRole="button"
              onPress={() => navigation.navigate('Chat', { seller: user.displayName })}
              style={styles.messageButton}
            >
              <MessageCircle color={colors.textPrimary} size={19} strokeWidth={2} />
              <Text style={styles.messageText}>私信</Text>
            </Pressable>
          </>
        )}
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
        <Pressable accessibilityLabel="返回" accessibilityRole="button" onPress={navigation.goBack} style={styles.navButton}>
          <ChevronLeft color={colors.textPrimary} size={27} strokeWidth={2} />
        </Pressable>
        <View style={styles.navIdentity}>
          <Text numberOfLines={1} style={styles.navTitle}>{user.displayName}</Text>
          <Text style={styles.navSubtitle}>{posts.length} 条动态</Text>
        </View>
        <View style={styles.navButton} />
      </View>

      <FlatList
        data={posts}
        keyExtractor={(post) => post.id}
        ListHeaderComponent={header}
        ListEmptyComponent={state.feeds.recommended.loadState === 'loading'
          ? <FeedState kind="loading" message="正在加载动态" />
          : <FeedState kind="empty" message="这里还没有可见动态" />}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        renderItem={({ item: post }) => (
          <FeedPost
            post={post}
            author={user}
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
  navbar: { height: 52, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, paddingHorizontal: 8 },
  navButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  navIdentity: { flex: 1, minWidth: 0 },
  navTitle: { flex: 1, color: colors.textPrimary, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  navSubtitle: { color: colors.textMuted, fontSize: 11, textAlign: 'center', marginTop: 1 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingTop: 18 },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border },
  identity: { flex: 1, minWidth: 0 },
  displayName: { color: colors.textPrimary, fontSize: 21, fontWeight: '900' },
  handle: { color: colors.textMuted, fontSize: 14, marginTop: 3 },
  profileCopy: { gap: 10, paddingHorizontal: 16, paddingTop: 14 },
  bio: { color: colors.textPrimary, fontSize: 15, lineHeight: 21 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  location: { color: colors.textMuted, fontSize: 13 },
  styleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  styleTag: { color: colors.brand, fontSize: 13, fontWeight: '700' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16 },
  statItem: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginRight: 22 },
  statValue: { color: colors.textPrimary, fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'] },
  statLabel: { color: colors.textMuted, fontSize: 13 },
  actionRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 16 },
  followButton: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 6, backgroundColor: colors.textPrimary },
  followingButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  followText: { color: colors.background, fontSize: 14, fontWeight: '800' },
  followingText: { color: colors.textPrimary },
  messageButton: { flex: 1, minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 6, borderWidth: 1, borderColor: colors.border },
  messageText: { color: colors.textPrimary, fontSize: 14, fontWeight: '800' },
  feedHeading: { height: 46, alignItems: 'center', justifyContent: 'flex-end', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  feedHeadingText: { color: colors.textPrimary, fontSize: 14, fontWeight: '800', paddingBottom: 11 },
  feedIndicator: { width: 54, height: 3, borderRadius: 2, backgroundColor: colors.brand },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  });
}
