import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { POST_CATEGORIES } from '../../constants/categories';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { useFeedStore } from '../../stores/feedStore';
import type { IFeedItem } from '../../types/feed';
import { formatTimeAgoFromString } from '../../utils/timeAgo';
import { findPostById } from './postDetailModel';

type DetailRoute = RouteProp<RootStackParamList, 'PostDetail'>;
type DetailNavigation = NativeStackNavigationProp<RootStackParamList, 'PostDetail'>;

function AuthorAvatar({ post }: { post: IFeedItem }) {
  if (post.author.avatarUrl) {
    return <Image source={{ uri: post.author.avatarUrl }} style={styles.avatar} />;
  }

  return (
    <View style={[styles.avatar, styles.avatarFallback]}>
      <Text style={styles.avatarFallbackText}>{post.author.nickname.slice(0, 1).toUpperCase()}</Text>
    </View>
  );
}

function PostMedia({ post }: { post: IFeedItem }) {
  return (
    <>
      {post.video?.posterUrl ? (
        <View style={styles.videoPosterWrap}>
          <Image source={{ uri: post.video.posterUrl }} style={styles.videoPoster} resizeMode="cover" />
          <View style={styles.videoBadge}>
            <Text style={styles.videoBadgeText}>▶ 视频</Text>
          </View>
        </View>
      ) : null}

      {post.images?.map((image, index) => (
        <Image
          key={`${image.url}-${index}`}
          source={{ uri: image.url }}
          style={styles.postImage}
          resizeMode="cover"
        />
      ))}

      {post.audio ? (
        <View style={styles.audioRow}>
          <View style={styles.audioIcon}>
            <Text style={styles.audioIconText}>♪</Text>
          </View>
          <View style={styles.audioMeta}>
            <Text style={styles.audioTitle}>{post.audio.title}</Text>
            <Text style={styles.audioDetail}>BPM {post.audio.bpm} · {post.audio.durationText}</Text>
          </View>
        </View>
      ) : null}
    </>
  );
}

export default function PostDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<DetailNavigation>();
  const route = useRoute<DetailRoute>();
  const feedList = useFeedStore((state) => state.feedList);
  const loadState = useFeedStore((state) => state.loadState);
  const loadFeed = useFeedStore((state) => state.loadFeed);
  const toggleLike = useFeedStore((state) => state.toggleLike);
  const toggleBookmark = useFeedStore((state) => state.toggleBookmark);
  const post = findPostById(feedList, route.params.postId);

  useEffect(() => {
    if (!post && loadState === 'idle') void loadFeed('public');
  }, [loadFeed, loadState, post]);

  const handleShare = async () => {
    if (!post) return;
    await Share.share({ message: `${post.author.nickname}：${post.content}` });
  };

  const renderContent = () => {
    if (!post && (loadState === 'idle' || loadState === 'loading')) {
      return <ActivityIndicator color={Colors.white} style={styles.stateBlock} />;
    }

    if (!post) {
      return (
        <View style={styles.stateBlock}>
          <Text style={styles.stateTitle}>动态不可用</Text>
          <Text style={styles.stateText}>内容可能已删除，或尚未加载到本机。</Text>
        </View>
      );
    }

    const category = POST_CATEGORIES.find((item) => item.id === post.category);

    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.authorRow}>
            <AuthorAvatar post={post} />
            <View style={styles.authorMeta}>
              <View style={styles.nameRow}>
                <Text style={styles.nickname}>{post.author.nickname}</Text>
                {post.author.styleTags.slice(0, 3).map((tag) => (
                  <View key={tag} style={styles.styleTag}>
                    <Text style={styles.styleTagText}>{tag}</Text>
                  </View>
                ))}
                {post.author.levelTag ? (
                  <View style={[styles.styleTag, styles.levelTag]}>
                    <Text style={styles.levelTagText}>{post.author.levelTag}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.timeText}>{formatTimeAgoFromString(post.createdAt)}</Text>
            </View>
          </View>

          {category ? (
            <View style={styles.categoryTag}>
              <Text style={styles.categoryTagText}>{category.emoji} {category.label}</Text>
            </View>
          ) : null}

          <Text style={styles.postContent}>{post.content}</Text>

          {post.tags.length > 0 ? (
            <Text style={styles.hashtags}>{post.tags.join(' ')}</Text>
          ) : null}

          <PostMedia post={post} />

          <View style={styles.actionRow}>
            <View style={styles.actionItem}>
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={styles.actionCount}>{post.commentCount}</Text>
            </View>
            <TouchableOpacity style={styles.actionItem} onPress={() => void handleShare()} accessibilityLabel="分享动态">
              <Text style={styles.actionIcon}>↗</Text>
              <Text style={styles.actionCount}>{post.shareCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => toggleLike(post.id)}
              accessibilityLabel={post.isLiked ? '取消点赞' : '点赞'}
            >
              <Text style={[styles.actionIcon, post.isLiked && styles.liked]}>{post.isLiked ? '♥' : '♡'}</Text>
              <Text style={[styles.actionCount, post.isLiked && styles.liked]}>{post.likeCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => toggleBookmark(post.id)}
              accessibilityLabel={post.isBookmarked ? '取消收藏' : '收藏'}
            >
              <Text style={styles.actionIcon}>{post.isBookmarked ? '🔖' : '🏷'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />
        <View style={styles.comments}>
          <Text style={styles.commentsTitle}>评论 {post.commentCount}</Text>
          <Text style={styles.commentsEmpty}>评论内容尚未加载</Text>
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.goBack()} accessibilityLabel="返回">
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>帖子详情</Text>
        <View style={styles.navButton} />
      </View>
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  navbar: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1a1d22',
  },
  navButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: Colors.white, fontSize: 32, lineHeight: 34 },
  navTitle: { color: Colors.white, fontSize: 17, fontWeight: '700' },
  scrollContent: { paddingBottom: 32 },
  content: { padding: 16, gap: 12 },
  authorRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: '#2a2d33' },
  avatarFallback: { backgroundColor: '#16181c', alignItems: 'center', justifyContent: 'center' },
  avatarFallbackText: { color: Colors.textSecondary, fontSize: 17, fontWeight: '800' },
  authorMeta: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  nickname: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  styleTag: {
    backgroundColor: '#1c2028', borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 0.5, borderColor: '#2e3340',
  },
  styleTagText: { color: '#8899bb', fontSize: 11, fontWeight: '700' },
  levelTag: { backgroundColor: '#0f1a2e', borderColor: '#1e3a5f' },
  levelTagText: { color: '#67aaff', fontSize: 11, fontWeight: '700' },
  timeText: { color: Colors.textMuted, fontSize: 12, marginTop: 3 },
  categoryTag: {
    alignSelf: 'flex-start', backgroundColor: '#111518', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3, borderWidth: 0.5, borderColor: '#252930',
  },
  categoryTagText: { color: Colors.textMuted, fontSize: 12 },
  postContent: { color: Colors.textPrimary, fontSize: 16, lineHeight: 26 },
  hashtags: { color: '#1d9bf0', fontSize: 14, lineHeight: 20 },
  videoPosterWrap: { width: '100%', aspectRatio: 16 / 9, borderRadius: 8, overflow: 'hidden' },
  videoPoster: { width: '100%', height: '100%' },
  videoBadge: {
    position: 'absolute', left: 10, bottom: 10,
    backgroundColor: 'rgba(0,0,0,0.72)', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6,
  },
  videoBadgeText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  postImage: { width: '100%', aspectRatio: 4 / 3, borderRadius: 8, backgroundColor: '#111318' },
  audioRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: '#111318', borderRadius: 8 },
  audioIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  audioIconText: { color: Colors.black, fontSize: 20, fontWeight: '800' },
  audioMeta: { flex: 1, gap: 3 },
  audioTitle: { color: Colors.white, fontSize: 14, fontWeight: '700' },
  audioDetail: { color: Colors.textMuted, fontSize: 12 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8 },
  actionItem: {
    minWidth: 44, minHeight: 44, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  actionIcon: { color: Colors.textMuted, fontSize: 20 },
  actionCount: { color: Colors.textMuted, fontSize: 13 },
  liked: { color: '#F91880' },
  divider: { height: 0.5, backgroundColor: '#1a1d22' },
  comments: { padding: 16, gap: 14 },
  commentsTitle: { color: Colors.white, fontSize: 15, fontWeight: '800' },
  commentsEmpty: { color: Colors.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 24 },
  stateBlock: { flex: 1, minHeight: 280, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  stateTitle: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  stateText: { color: Colors.textMuted, fontSize: 13, textAlign: 'center' },
});
