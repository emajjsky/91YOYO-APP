import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  type ImageSourcePropType,
  Pressable,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Bookmark, ChevronLeft, Clock3, Heart, MessageCircle, Share2 } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { useSocialStore } from '../../features/social/socialStore';
import type { SocialPost, SocialUser } from '../../features/social/types';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { orderVideoPosts } from './videoFeedModel';

type Props = NativeStackScreenProps<RootStackParamList, 'VideoFeed'>;

function imageSource(uri: number | string): ImageSourcePropType {
  return typeof uri === 'number' ? uri : { uri };
}

function compactCount(value: number): string {
  if (value >= 10_000) return `${Math.round(value / 10_000)}万`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(value);
}

function RailButton({ label, count, active = false, onPress, children }: {
  label: string;
  count?: number;
  active?: boolean;
  onPress(): void;
  children: React.ReactNode;
}) {
  return (
    <Pressable accessibilityLabel={label} accessibilityRole="button" onPress={onPress} style={styles.railAction}>
      <View style={[styles.railIcon, active && styles.railIconActive]}>{children}</View>
      {count !== undefined ? <Text style={styles.railCount}>{compactCount(count)}</Text> : null}
    </Pressable>
  );
}

function VideoPage({ post, author, height, bottomInset, isLiked, isBookmarked, onAuthor, onLike, onComment, onBookmark, onShare }: {
  post: SocialPost;
  author: SocialUser;
  height: number;
  bottomInset: number;
  isLiked: boolean;
  isBookmarked: boolean;
  onAuthor(): void;
  onLike(): void;
  onComment(): void;
  onBookmark(): void;
  onShare(): void;
}) {
  if (post.media.type !== 'video') return null;

  return (
    <View style={[styles.page, { height }]}>
      <Image source={imageSource(post.media.asset.posterUri)} resizeMode="cover" style={StyleSheet.absoluteFill} />
      <View style={styles.imageShade} />

      {post.media.asset.playbackStatus === 'reserved' ? (
        <View style={styles.reservedState}>
          <Clock3 color={Colors.textPrimary} size={24} strokeWidth={1.8} />
          <Text style={styles.reservedTitle}>视频素材准备中</Text>
          <Text style={styles.reservedSubtitle}>当前仅展示封面</Text>
        </View>
      ) : null}

      <View style={[styles.rail, { bottom: bottomInset + 104 }]}>
        <Pressable accessibilityLabel={`查看${author.displayName}的主页`} accessibilityRole="button" onPress={onAuthor} style={styles.avatarButton}>
          <Image source={imageSource(author.avatarUri)} style={styles.avatar} />
        </Pressable>
        <RailButton label={isLiked ? '取消点赞' : '点赞'} count={post.likeCount} active={isLiked} onPress={onLike}>
          <Heart color={isLiked ? Colors.like : Colors.textPrimary} fill={isLiked ? Colors.like : 'transparent'} size={25} strokeWidth={2} />
        </RailButton>
        <RailButton label="评论" count={post.commentCount} onPress={onComment}>
          <MessageCircle color={Colors.textPrimary} size={25} strokeWidth={2} />
        </RailButton>
        <RailButton label={isBookmarked ? '取消收藏' : '收藏'} active={isBookmarked} onPress={onBookmark}>
          <Bookmark color={isBookmarked ? Colors.brand : Colors.textPrimary} fill={isBookmarked ? Colors.brand : 'transparent'} size={24} strokeWidth={2} />
        </RailButton>
        <RailButton label="分享" onPress={onShare}>
          <Share2 color={Colors.textPrimary} size={24} strokeWidth={2} />
        </RailButton>
      </View>

      <View style={[styles.metadata, { bottom: bottomInset + 24 }]}>
        <Text style={styles.handle}>@{author.handle}</Text>
        <Text numberOfLines={3} style={styles.content}>{post.content}</Text>
        {post.hashtags.length > 0 ? <Text numberOfLines={2} style={styles.hashtags}>{post.hashtags.join(' ')}</Text> : null}
      </View>
    </View>
  );
}

export default function VideoFeedScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const state = useSocialStore();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    void useSocialStore.getState().loadFeed('recommended');
  }, []);

  const videos = useMemo(
    () => orderVideoPosts(Object.values(state.postsById), route.params.initialPostId),
    [route.params.initialPostId, state.postsById],
  );

  const sharePost = useCallback(async (post: SocialPost, author: SocialUser) => {
    await Share.share({ message: `${author.displayName}：${post.content}` });
  }, []);

  if (videos.length === 0) {
    return (
      <View style={styles.emptyScreen}>
        <StatusBar style="light" />
        <Pressable accessibilityLabel="返回" accessibilityRole="button" onPress={navigation.goBack} style={[styles.backButton, { top: insets.top + 8 }]}>
          <ChevronLeft color={Colors.textPrimary} size={28} strokeWidth={2} />
        </Pressable>
        <Text style={styles.emptyTitle}>视频不可用</Text>
        <Text style={styles.emptyMessage}>内容可能尚未加载到本机</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <FlatList
        data={videos}
        decelerationRate="fast"
        disableIntervalMomentum
        getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
        keyExtractor={(post) => post.id}
        onMomentumScrollEnd={(event) => {
          setActiveIndex(Math.max(0, Math.round(event.nativeEvent.contentOffset.y / height)));
        }}
        pagingEnabled
        renderItem={({ item }) => {
          const author = state.usersById[item.authorId];
          if (!author) return <View style={{ height }} />;
          return (
            <VideoPage
              post={item}
              author={author}
              height={height}
              bottomInset={insets.bottom}
              isLiked={state.likedPostIds.includes(item.id)}
              isBookmarked={state.bookmarkedPostIds.includes(item.id)}
              onAuthor={() => navigation.navigate('UserProfile', { userId: author.id })}
              onLike={() => state.toggleLike(item.id)}
              onComment={() => navigation.navigate('PostDetail', { postId: item.id })}
              onBookmark={() => state.toggleBookmark(item.id)}
              onShare={() => void sharePost(item, author)}
            />
          );
        }}
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
      />

      <View style={[styles.topBar, { top: insets.top + 8 }]} pointerEvents="box-none">
        <Pressable accessibilityLabel="返回" accessibilityRole="button" hitSlop={8} onPress={navigation.goBack} style={styles.backButton}>
          <ChevronLeft color={Colors.textPrimary} size={28} strokeWidth={2} />
        </Pressable>
        <Text style={styles.counter}>{activeIndex + 1} / {videos.length}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.black },
  page: { width: '100%', backgroundColor: Colors.black, overflow: 'hidden' },
  imageShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0, 0, 0, 0.28)' },
  reservedState: { position: 'absolute', left: '20%', right: '20%', top: '39%', alignItems: 'center', gap: 6, paddingVertical: 14, borderRadius: 6, backgroundColor: 'rgba(0, 0, 0, 0.62)' },
  reservedTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },
  reservedSubtitle: { color: Colors.textSecondary, fontSize: 12 },
  rail: { position: 'absolute', right: 10, alignItems: 'center', gap: 10 },
  avatarButton: { width: 50, height: 50, borderRadius: 25, padding: 2, backgroundColor: Colors.textPrimary },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.surface },
  railAction: { width: 56, minHeight: 55, alignItems: 'center', justifyContent: 'center' },
  railIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.48)' },
  railIconActive: { backgroundColor: 'rgba(0, 0, 0, 0.72)' },
  railCount: { color: Colors.textPrimary, fontSize: 11, fontWeight: '700', marginTop: 2, textShadowColor: Colors.black, textShadowRadius: 3 },
  metadata: { position: 'absolute', left: 16, right: 80, gap: 6 },
  handle: { color: Colors.textPrimary, fontSize: 15, fontWeight: '800', textShadowColor: Colors.black, textShadowRadius: 4 },
  content: { color: Colors.textPrimary, fontSize: 14, lineHeight: 20, textShadowColor: Colors.black, textShadowRadius: 4 },
  hashtags: { color: Colors.textPrimary, fontSize: 13, fontWeight: '600', textShadowColor: Colors.black, textShadowRadius: 4 },
  topBar: { position: 'absolute', left: 10, right: 14, height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.48)' },
  counter: { color: Colors.textPrimary, fontSize: 13, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4, backgroundColor: 'rgba(0, 0, 0, 0.48)' },
  emptyScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.black },
  emptyTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  emptyMessage: { color: Colors.textMuted, fontSize: 13 },
});
