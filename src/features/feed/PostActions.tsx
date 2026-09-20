import React from 'react';
import { Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import { Bookmark, Heart, MessageCircle, Repeat2, Share } from 'lucide-react-native';
import { Colors } from '../../constants/colors';

function compactCount(value: number): string {
  if (value >= 10_000) return `${(value / 10_000).toFixed(value >= 100_000 ? 0 : 1)}万`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}k`;
  return String(value);
}

function ActionButton({ label, count, color = Colors.textMuted, onPress, children }: {
  label: string;
  count?: number;
  color?: string;
  onPress(): void;
  children: React.ReactNode;
}) {
  const handlePress = (event: GestureResponderEvent) => {
    event.stopPropagation();
    onPress();
  };
  return (
    <Pressable accessibilityLabel={label} accessibilityRole="button" onPress={handlePress} style={styles.action}>
      {children}
      {count !== undefined ? <Text style={[styles.count, { color }]}>{compactCount(count)}</Text> : null}
    </Pressable>
  );
}

export interface PostActionsProps {
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  onLike(): void;
  onBookmark(): void;
  onComment(): void;
  onShare(): void;
}

export default function PostActions(props: PostActionsProps) {
  const likeColor = props.isLiked ? Colors.like : Colors.textMuted;
  return (
    <View style={styles.row}>
      <ActionButton label="评论" count={props.commentCount} onPress={props.onComment}><MessageCircle color={Colors.textMuted} size={19} strokeWidth={1.8} /></ActionButton>
      <ActionButton label="转发" count={props.shareCount} onPress={props.onShare}><Repeat2 color={Colors.textMuted} size={19} strokeWidth={1.8} /></ActionButton>
      <ActionButton label={props.isLiked ? '取消点赞' : '点赞'} count={props.likeCount} color={likeColor} onPress={props.onLike}><Heart color={likeColor} fill={props.isLiked ? likeColor : 'transparent'} size={19} strokeWidth={1.8} /></ActionButton>
      <ActionButton label={props.isBookmarked ? '取消收藏' : '收藏'} onPress={props.onBookmark}><Bookmark color={props.isBookmarked ? Colors.brand : Colors.textMuted} fill={props.isBookmarked ? Colors.brand : 'transparent'} size={19} strokeWidth={1.8} /></ActionButton>
      <ActionButton label="分享" onPress={props.onShare}><Share color={Colors.textMuted} size={18} strokeWidth={1.8} /></ActionButton>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  action: { minWidth: 44, height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  count: { fontSize: 12, fontVariant: ['tabular-nums'] },
});
