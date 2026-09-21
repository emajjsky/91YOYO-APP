import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  type ImageSourcePropType,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronLeft, Heart, Send } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import PostActions from '../../features/feed/PostActions';
import PostHeader from '../../features/feed/PostHeader';
import PostMedia from '../../features/feed/PostMedia';
import { useSocialStore } from '../../features/social/socialStore';
import type { SocialComment, SocialUser } from '../../features/social/types';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { formatTimeAgoFromString } from '../../utils/timeAgo';
import { COMMENT_BODY_LIMIT, commentsForPost, normalizeCommentBody } from './postDetailModel';

type Props = NativeStackScreenProps<RootStackParamList, 'PostDetail'>;

function imageSource(uri: number | string): ImageSourcePropType {
  return typeof uri === 'number' ? uri : { uri };
}

function CommentRow({ comment, author, isLiked, onLike, onAuthor }: {
  comment: SocialComment;
  author: SocialUser | undefined;
  isLiked: boolean;
  onLike(): void;
  onAuthor(): void;
}) {
  return (
    <View style={styles.commentRow}>
      <Pressable accessibilityLabel={`查看${author?.displayName ?? '用户'}的主页`} accessibilityRole="button" onPress={onAuthor}>
        {author ? (
          <Image source={imageSource(author.avatarUri)} style={styles.commentAvatar} />
        ) : (
          <View style={[styles.commentAvatar, styles.avatarFallback]} />
        )}
      </Pressable>
      <View style={styles.commentBody}>
        <View style={styles.commentMeta}>
          <Text numberOfLines={1} style={styles.commentAuthor}>{author?.displayName ?? '91YOYO 用户'}</Text>
          <Text style={styles.commentTime}>{formatTimeAgoFromString(comment.createdAt)}</Text>
        </View>
        <Text style={styles.commentText}>{comment.body}</Text>
      </View>
      <Pressable accessibilityLabel={isLiked ? '取消点赞评论' : '点赞评论'} accessibilityRole="button" onPress={onLike} style={styles.commentLike}>
        <Heart color={isLiked ? Colors.like : Colors.textMuted} fill={isLiked ? Colors.like : 'transparent'} size={16} strokeWidth={2} />
        <Text style={[styles.commentLikeCount, isLiked && styles.commentLiked]}>{comment.likeCount}</Text>
      </Pressable>
    </View>
  );
}

export default function PostDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const state = useSocialStore();
  const inputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [body, setBody] = useState('');
  const [composerError, setComposerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!state.postsById[route.params.postId]);
  const [didLoad, setDidLoad] = useState(Boolean(state.postsById[route.params.postId]));
  const post = state.postsById[route.params.postId];
  const author = post ? state.usersById[post.authorId] : undefined;
  const comments = useMemo(
    () => commentsForPost(Object.values(state.commentsById), route.params.postId),
    [route.params.postId, state.commentsById],
  );

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    void useSocialStore.getState().loadPost(route.params.postId).finally(() => {
      if (!active) return;
      setIsLoading(false);
      setDidLoad(true);
    });
    return () => { active = false; };
  }, [route.params.postId]);

  const handleShare = async () => {
    if (!post || !author) return;
    await Share.share({ message: `${author.displayName}：${post.content}` });
  };

  const openMedia = () => {
    if (post?.media.type === 'video') {
      navigation.navigate('VideoFeed', { initialPostId: post.id });
    }
  };

  const submitComment = () => {
    if (!post) return;
    const normalized = normalizeCommentBody(body);
    if (!normalized) {
      setComposerError(body.trim().length > COMMENT_BODY_LIMIT ? '评论不能超过 280 字' : '请输入评论内容');
      return;
    }
    const created = state.addComment(post.id, normalized);
    if (!created) {
      setComposerError('评论发布失败，请重试');
      return;
    }
    setBody('');
    setComposerError(null);
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  const renderBody = () => {
    if (isLoading && !post) {
      return <ActivityIndicator color={Colors.brand} style={styles.stateBlock} />;
    }
    if (didLoad && (!post || !author)) {
      return (
        <View style={styles.stateBlock}>
          <Text style={styles.stateTitle}>动态不可用</Text>
          <Text style={styles.stateText}>内容可能已删除，或尚未加载到本机。</Text>
        </View>
      );
    }
    if (!post || !author) return null;

    return (
      <>
        <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.postBlock}>
            <PostHeader
              author={author}
              createdAt={post.createdAt}
              onOpenAuthor={() => navigation.navigate('UserProfile', { userId: author.id })}
            />
            <View style={styles.postBody}>
              <Text style={styles.postContent}>
                {post.content}
                {post.hashtags.length > 0 ? <Text style={styles.hashtags}> {post.hashtags.join(' ')}</Text> : null}
              </Text>
              <PostMedia media={post.media} onOpen={openMedia} />
              <PostActions
                likeCount={post.likeCount}
                commentCount={post.commentCount}
                shareCount={post.shareCount}
                isLiked={state.likedPostIds.includes(post.id)}
                isBookmarked={state.bookmarkedPostIds.includes(post.id)}
                onLike={() => state.toggleLike(post.id)}
                onBookmark={() => state.toggleBookmark(post.id)}
                onComment={() => inputRef.current?.focus()}
                onShare={() => void handleShare()}
              />
            </View>
          </View>

          <View style={styles.commentsHeader}>
            <Text style={styles.commentsTitle}>评论</Text>
            <Text style={styles.commentsCount}>{post.commentCount}</Text>
          </View>
          {comments.length > 0 ? comments.map((comment) => {
            const commentAuthor = state.usersById[comment.authorId];
            return (
              <CommentRow
                key={comment.id}
                comment={comment}
                author={commentAuthor}
                isLiked={state.likedCommentIds.includes(comment.id)}
                onLike={() => state.toggleCommentLike(comment.id)}
                onAuthor={() => commentAuthor && navigation.navigate('UserProfile', { userId: commentAuthor.id })}
              />
            );
          }) : (
            <View style={styles.emptyComments}>
              <Text style={styles.emptyCommentsTitle}>还没有评论</Text>
              <Text style={styles.emptyCommentsText}>成为第一个参与讨论的人</Text>
            </View>
          )}
        </ScrollView>

        <View style={[styles.composer, { paddingBottom: Math.max(8, insets.bottom) }]}>
          <View style={styles.composerRow}>
            <TextInput
              ref={inputRef}
              accessibilityLabel="写评论"
              maxLength={COMMENT_BODY_LIMIT}
              multiline
              onChangeText={(value) => { setBody(value); setComposerError(null); }}
              placeholder="写下你的评论"
              placeholderTextColor={Colors.textMuted}
              style={styles.composerInput}
              value={body}
            />
            <Pressable accessibilityLabel="发布评论" accessibilityRole="button" onPress={submitComment} style={[styles.sendButton, !normalizeCommentBody(body) && styles.sendButtonDisabled]}>
              <Send color={normalizeCommentBody(body) ? Colors.background : Colors.textMuted} size={19} strokeWidth={2.2} />
            </Pressable>
          </View>
          <View style={styles.composerMeta}>
            <Text style={styles.composerError}>{composerError ?? ''}</Text>
            <Text style={styles.characterCount}>{body.length}/{COMMENT_BODY_LIMIT}</Text>
          </View>
        </View>
      </>
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.navbar}>
        <Pressable accessibilityLabel="返回" accessibilityRole="button" onPress={navigation.goBack} style={styles.navButton}>
          <ChevronLeft color={Colors.textPrimary} size={27} strokeWidth={2} />
        </Pressable>
        <Text style={styles.navTitle}>帖子详情</Text>
        <View style={styles.navButton} />
      </View>
      <View style={styles.contentArea}>{renderBody()}</View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  navbar: { height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  navButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  navTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '800' },
  contentArea: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  postBlock: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 },
  postBody: { marginLeft: 52, gap: 9 },
  postContent: { color: Colors.textPrimary, fontSize: 16, lineHeight: 23 },
  hashtags: { color: Colors.brand },
  commentsHeader: { height: 48, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 16, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: Colors.border },
  commentsTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: '800' },
  commentsCount: { color: Colors.textMuted, fontSize: 13 },
  commentRow: { minHeight: 84, flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface },
  avatarFallback: { borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border },
  commentBody: { flex: 1, minWidth: 0 },
  commentMeta: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  commentAuthor: { maxWidth: '65%', color: Colors.textPrimary, fontSize: 13, fontWeight: '700' },
  commentTime: { color: Colors.textMuted, fontSize: 11 },
  commentText: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 5 },
  commentLike: { width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', gap: 2 },
  commentLikeCount: { color: Colors.textMuted, fontSize: 10 },
  commentLiked: { color: Colors.like },
  emptyComments: { minHeight: 150, alignItems: 'center', justifyContent: 'center', gap: 5 },
  emptyCommentsTitle: { color: Colors.textSecondary, fontSize: 14, fontWeight: '700' },
  emptyCommentsText: { color: Colors.textMuted, fontSize: 12 },
  composer: { paddingTop: 8, paddingHorizontal: 12, backgroundColor: Colors.background, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
  composerRow: { minHeight: 42, flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  composerInput: { flex: 1, minHeight: 40, maxHeight: 100, color: Colors.textPrimary, fontSize: 14, lineHeight: 19, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 8, backgroundColor: Colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border },
  sendButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.brand },
  sendButtonDisabled: { backgroundColor: Colors.surface },
  composerMeta: { height: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 3 },
  composerError: { flex: 1, color: Colors.like, fontSize: 11 },
  characterCount: { color: Colors.textMuted, fontSize: 10 },
  stateBlock: { flex: 1, minHeight: 280, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  stateTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  stateText: { color: Colors.textMuted, fontSize: 13, textAlign: 'center' },
});
