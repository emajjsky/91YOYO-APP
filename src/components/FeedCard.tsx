/**
 * 共用 FeedCard 组件 — 首页 & 探索页共享
 */
import React from 'react';
import {
  View, Text, Image, TouchableOpacity,
  StyleSheet, Dimensions, Alert,
} from 'react-native';
import { Colors } from '../constants/colors';
import { POST_CATEGORIES } from '../constants/categories';
import { formatTimeAgoFromString } from '../utils/timeAgo';
import type { IFeedItem } from '../types/feed';

const { width: SCREEN_W } = Dimensions.get('window');
const GRID_GAP = 3;
const GRID_ITEM_W = (SCREEN_W - 32 - GRID_GAP * 2) / 3;

// ── 花式标签 ─────────────────────────────────────
function StyleTags({ tags, levelTag }: { tags: string[]; levelTag?: string }) {
  const displayTags = tags.slice(0, 3);
  const overflow = tags.length - 3;
  return (
    <View style={s.styleTagRow}>
      {displayTags.map((t) => (
        <View key={t} style={s.styleTag}>
          <Text style={s.styleTagText}>{t}</Text>
        </View>
      ))}
      {overflow > 0 && (
        <View style={s.styleTag}>
          <Text style={s.styleTagText}>+{overflow}</Text>
        </View>
      )}
      {!!levelTag && (
        <View style={[s.styleTag, s.levelTag]}>
          <Text style={s.levelTagText}>{levelTag}</Text>
        </View>
      )}
    </View>
  );
}

// ── 分类标签 ─────────────────────────────────────
function CategoryTag({ categoryId }: { categoryId: string }) {
  const cat = POST_CATEGORIES.find((c) => c.id === categoryId);
  if (!cat) return null;
  return (
    <View style={s.categoryTag}>
      <Text style={s.categoryTagText}>{cat.emoji} {cat.label}</Text>
    </View>
  );
}

// ── 图片网格 ─────────────────────────────────────
function ImageGrid({ images }: { images: { url: string }[] }) {
  const count = Math.min(images.length, 9);
  if (count === 0) return null;
  if (count === 1) {
    return (
      <Image
        source={{ uri: images[0].url }}
        style={s.singleImage}
        resizeMode="cover"
      />
    );
  }
  if (count === 2) {
    return (
      <View style={s.twoGrid}>
        {images.slice(0, 2).map((img, i) => (
          <Image key={i} source={{ uri: img.url }} style={s.twoGridItem} resizeMode="cover" />
        ))}
      </View>
    );
  }
  return (
    <View style={s.nineGrid}>
      {images.slice(0, 9).map((img, i) => (
        <Image key={i} source={{ uri: img.url }} style={s.nineGridItem} resizeMode="cover" />
      ))}
    </View>
  );
}

// ── 视频卡 ───────────────────────────────────────
function VideoCard({ video }: { video: NonNullable<IFeedItem['video']> }) {
  return (
    <TouchableOpacity
      style={s.videoCard}
      onPress={() => Alert.alert('播放视频', '点击进入帖子详情页查看慢放/镜像控件')}
      activeOpacity={0.9}
    >
      <Image source={{ uri: video.posterUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <View style={s.videoOverlay} />
      <View style={s.playBtn}>
        <Text style={s.playIcon}>▶</Text>
      </View>
      <Text style={s.videoTitle} numberOfLines={1}>{video.title}</Text>
    </TouchableOpacity>
  );
}

// ── 音频条 ───────────────────────────────────────
function AudioBar({ audio }: { audio: NonNullable<IFeedItem['audio']> }) {
  return (
    <View style={s.audioBar}>
      <View style={s.audioInfo}>
        <Text style={s.audioTitle} numberOfLines={2}>{audio.title}</Text>
        <Text style={s.audioBpm}>BPM {audio.bpm} · {audio.durationText}</Text>
        {!!audio.tag && <Text style={s.audioTag}>{audio.tag}</Text>}
      </View>
      <TouchableOpacity style={s.audioPlayBtn}>
        <Text style={s.audioPlayIcon}>▶</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── 主 FeedCard ───────────────────────────────────
export interface FeedCardProps {
  item: IFeedItem;
  onLike?: () => void;
  onBookmark?: () => void;
  onPress?: () => void;
}

export default function FeedCard({ item, onLike, onBookmark, onPress }: FeedCardProps) {
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.97}>
      {/* 作者信息行 */}
      <View style={s.authorRow}>
        <Image source={{ uri: item.author.avatarUrl }} style={s.avatar} />
        <View style={s.authorMeta}>
          <View style={s.nameRow}>
            <Text style={s.nickname} numberOfLines={1}>{item.author.nickname}</Text>
            <StyleTags tags={item.author.styleTags} levelTag={item.author.levelTag} />
          </View>
          <Text style={s.timeText}>{formatTimeAgoFromString(item.createdAt)}</Text>
        </View>
        <TouchableOpacity style={s.moreBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={s.moreDots}>···</Text>
        </TouchableOpacity>
      </View>

      {/* 分类标签 */}
      <CategoryTag categoryId={item.category} />

      {/* 正文 */}
      <Text style={s.content}>{item.content}</Text>

      {/* Hashtag */}
      {item.tags.length > 0 && (
        <Text style={s.hashtags}>
          {item.tags.join(' ')}
        </Text>
      )}

      {/* 媒体 */}
      {!!item.video && <VideoCard video={item.video} />}
      {!!item.images && item.images.length > 0 && <ImageGrid images={item.images} />}
      {!!item.audio && <AudioBar audio={item.audio} />}

      {/* 互动栏 */}
      <View style={s.actionRow}>
        <TouchableOpacity style={s.actionBtn}>
          <Text style={s.actionIcon}>💬</Text>
          <Text style={s.actionCount}>{item.commentCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtn}>
          <Text style={s.actionIcon}>↗</Text>
          <Text style={s.actionCount}>{item.shareCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtn} onPress={onLike}>
          <Text style={[s.actionIcon, item.isLiked && s.liked]}>
            {item.isLiked ? '♥' : '♡'}
          </Text>
          <Text style={[s.actionCount, item.isLiked && s.liked]}>
            {item.likeCount}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtn} onPress={onBookmark}>
          <Text style={s.actionIcon}>{item.isBookmarked ? '🔖' : '🏷'}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ── 样式 ─────────────────────────────────────────
const s = StyleSheet.create({
  card: {
    backgroundColor: Colors.bg,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
    gap: 9,
  },

  // 作者行
  authorRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#1a1a1a',             // 防止加载时白底
    borderWidth: 1.5, borderColor: '#2a2d33',
  },
  authorMeta: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  nickname: { color: Colors.white, fontSize: 15, fontWeight: '700', flexShrink: 1 },
  timeText: { color: Colors.textMuted, fontSize: 12 },
  moreBtn: { paddingLeft: 4 },
  moreDots: { color: Colors.textMuted, fontSize: 20, letterSpacing: 1 },

  // 花式标签
  styleTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  styleTag: {
    backgroundColor: '#1c2028', borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 0.5, borderColor: '#2e3340',
  },
  styleTagText: { color: '#8899bb', fontSize: 11, fontWeight: '700' },
  levelTag: { backgroundColor: '#0f1a2e', borderColor: '#1e3a5f' },
  levelTagText: { color: '#67aaff', fontSize: 11, fontWeight: '700' },

  // 分类标签
  categoryTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#0e1117',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 0.5, borderColor: '#252930',
  },
  categoryTagText: { color: Colors.textMuted, fontSize: 12 },

  // 正文
  content: { color: Colors.textPrimary, fontSize: 15, lineHeight: 23 },
  hashtags: { color: '#1d9bf0', fontSize: 14, lineHeight: 20 },

  // 视频
  videoCard: {
    width: '100%', aspectRatio: 16 / 9,
    borderRadius: 14, overflow: 'hidden',
    backgroundColor: '#111',
    justifyContent: 'center', alignItems: 'center',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  playBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.14)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)',
  },
  playIcon: { color: '#fff', fontSize: 20, marginLeft: 3 },
  videoTitle: {
    position: 'absolute', bottom: 10, left: 12, right: 12,
    color: 'rgba(255,255,255,0.72)', fontSize: 11,
  },

  // 图片
  singleImage: { width: '100%', aspectRatio: 4 / 3, borderRadius: 14, backgroundColor: '#1a1a1a' },
  twoGrid: { flexDirection: 'row', gap: GRID_GAP },
  twoGridItem: { flex: 1, aspectRatio: 1, borderRadius: 10, backgroundColor: '#1a1a1a' },
  nineGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
  nineGridItem: { width: GRID_ITEM_W, height: GRID_ITEM_W, borderRadius: 8, backgroundColor: '#1a1a1a' },

  // 音频
  audioBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0e1117',
    borderRadius: 14, borderWidth: 0.5, borderColor: '#1e2330',
    padding: 12, gap: 10,
  },
  audioInfo: { flex: 1, gap: 3 },
  audioTitle: { color: Colors.textPrimary, fontSize: 13, fontWeight: '600' },
  audioBpm: { color: Colors.textMuted, fontSize: 11 },
  audioTag: { color: Colors.textSecondary, fontSize: 11 },
  audioPlayBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.white,
    justifyContent: 'center', alignItems: 'center',
  },
  audioPlayIcon: { color: Colors.black, fontSize: 14, fontWeight: '800', marginLeft: 2 },

  // 互动栏
  actionRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 0.5, borderTopColor: '#111518',
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionIcon: { color: Colors.textMuted, fontSize: 18 },
  actionCount: { color: Colors.textMuted, fontSize: 13 },
  liked: { color: '#F91880' },
});
