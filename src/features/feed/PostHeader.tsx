import React from 'react';
import {
  Image,
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { MoreHorizontal } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { formatTimeAgoFromString } from '../../utils/timeAgo';
import type { SocialUser } from '../social/types';

function imageSource(uri: number | string): ImageSourcePropType {
  return typeof uri === 'number' ? uri : { uri };
}

export interface PostHeaderProps {
  author: SocialUser;
  createdAt: string;
  onOpenAuthor(): void;
  onMore?(): void;
}

export default function PostHeader({ author, createdAt, onOpenAuthor, onMore }: PostHeaderProps) {
  const handleAuthorPress = (event: GestureResponderEvent) => {
    event.stopPropagation();
    onOpenAuthor();
  };

  const handleMorePress = (event: GestureResponderEvent) => {
    event.stopPropagation();
    onMore?.();
  };

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityLabel={`查看${author.displayName}的主页`}
        accessibilityRole="button"
        hitSlop={6}
        onPress={handleAuthorPress}
      >
        <Image source={imageSource(author.avatarUri)} style={styles.avatar} />
      </Pressable>
      <Pressable
        accessibilityLabel={`查看${author.displayName}的主页`}
        accessibilityRole="button"
        onPress={handleAuthorPress}
        style={styles.identity}
      >
        <View style={styles.nameLine}>
          <Text numberOfLines={1} style={styles.name}>{author.displayName}</Text>
          {author.roleLabel ? <Text style={styles.role}>{author.roleLabel}</Text> : null}
        </View>
        <Text numberOfLines={1} style={styles.meta}>
          @{author.handle} · {formatTimeAgoFromString(createdAt)}
        </Text>
      </Pressable>
      {onMore ? (
        <Pressable
          accessibilityLabel="更多操作"
          accessibilityRole="button"
          hitSlop={8}
          onPress={handleMorePress}
          style={styles.iconButton}
        >
          <MoreHorizontal color={Colors.textMuted} size={20} strokeWidth={2} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.surface },
  identity: { flex: 1, minHeight: 44, justifyContent: 'center' },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 },
  name: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700', flexShrink: 1 },
  role: { color: Colors.brand, fontSize: 11, fontWeight: '700' },
  meta: { color: Colors.textMuted, fontSize: 13, marginTop: 2 },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
