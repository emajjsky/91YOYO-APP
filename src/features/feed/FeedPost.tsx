import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import type { SocialPost, SocialUser } from '../social/types';
import PostActions from './PostActions';
import PostHeader from './PostHeader';
import PostMedia from './PostMedia';

export interface FeedPostProps {
  post: SocialPost;
  author: SocialUser;
  recommendationReason?: string | null;
  isLiked: boolean;
  isBookmarked: boolean;
  onOpen(): void;
  onOpenMedia?(): void;
  onOpenAuthor(): void;
  onLike(): void;
  onBookmark(): void;
  onComment(): void;
  onShare(): void;
  onMore?(): void;
}

export default function FeedPost({ post, author, recommendationReason, isLiked, isBookmarked, onOpen, onOpenMedia, onOpenAuthor, onLike, onBookmark, onComment, onShare, onMore }: FeedPostProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onOpen} style={styles.post}>
      {recommendationReason ? <Text numberOfLines={1} style={styles.reason}>推荐 · {recommendationReason}</Text> : null}
      <PostHeader author={author} createdAt={post.createdAt} onOpenAuthor={onOpenAuthor} onMore={onMore} />
      <View style={styles.body}>
        <Text style={styles.content}>
          {post.content}
          {post.hashtags.length > 0 ? <Text style={styles.hashtags}> {post.hashtags.join(' ')}</Text> : null}
        </Text>
        <PostMedia media={post.media} onOpen={onOpenMedia ?? onOpen} />
        <PostActions likeCount={post.likeCount} commentCount={post.commentCount} shareCount={post.shareCount} isLiked={isLiked} isBookmarked={isBookmarked} onLike={onLike} onBookmark={onBookmark} onComment={onComment} onShare={onShare} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  post: { backgroundColor: Colors.background, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 4 },
  reason: { color: Colors.textMuted, fontSize: 12, fontWeight: '600', marginLeft: 52, marginBottom: 6 },
  body: { marginLeft: 52, gap: 8 },
  content: { color: Colors.textPrimary, fontSize: 15, lineHeight: 21 },
  hashtags: { color: Colors.brand },
});
