import React, { useState } from 'react';
import {
  View, Text, Image, TouchableOpacity,
  ScrollView, StyleSheet, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { POST_CATEGORIES } from '../../constants/categories';
import { formatTimeAgoFromString } from '../../utils/timeAgo';

const { width: SCREEN_W } = Dimensions.get('window');

const MOCK_POST = {
  id: 'post_detail_1',
  author: {
    nickname: '陈悠悠',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    styleTags: ['5A'],
    levelTag: '1A进阶',
  },
  category: 'tutorial',
  content: '今天练熟了这套 5A 反向搭线连招，重头配比调到了 1:6，大家可以慢放和镜像跟着看搭线细节！⚡\n\n关键点：上弦角度要保持在 45° 左右，否则搭线会偏移。慢放看清楚每一步手型！',
  tags: ['#5A离手', '#招式慢放求指点', '#反向搭线'],
  createdAt: '10分钟前',
  likeCount: 48,
  commentCount: 3,
  shareCount: 6,
  isLiked: false,
  video: {
    title: '5A Gridiron 反向翻绳连招拆解.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    canDownload: true,
  },
};

const MOCK_COMMENTS = [
  { id: 'c1', nickname: 'Speed_1A', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80', text: '太详细了！慢放看到了搭线细节，一直搞不清楚这个步骤 🙏', time: '8分钟前', likes: 5 },
  { id: 'c2', nickname: '加拿大暴雪控', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&auto=format&fit=crop&q=80', text: '反向搭线连招配比 1:6 真的香，这个我也在研究！', time: '5分钟前', likes: 3 },
  { id: 'c3', nickname: 'Yoyo_Lab', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&auto=format&fit=crop&q=80', text: '镜像功能好用！跟着右手练的可以用镜像看左手视角', time: '2分钟前', likes: 7 },
];

export default function PostDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isSlowMo, setIsSlowMo] = useState(false);
  const [isMirror, setIsMirror] = useState(false);
  const [isLiked, setIsLiked] = useState(MOCK_POST.isLiked);
  const [likeCount, setLikeCount] = useState(MOCK_POST.likeCount);

  const cat = POST_CATEGORIES.find((c) => c.id === MOCK_POST.category);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount((n) => n + (isLiked ? -1 : 1));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 顶部导航 */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>帖子详情</Text>
        <TouchableOpacity>
          <Text style={styles.moreBtn}>···</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* 作者行 */}
          <View style={styles.authorRow}>
            <Image source={{ uri: MOCK_POST.author.avatarUrl }} style={styles.avatar} />
            <View style={styles.authorMeta}>
              <View style={styles.nameRow}>
                <Text style={styles.nickname}>{MOCK_POST.author.nickname}</Text>
                {MOCK_POST.author.styleTags.map((t) => (
                  <View key={t} style={styles.styleTag}>
                    <Text style={styles.styleTagText}>{t}</Text>
                  </View>
                ))}
                {MOCK_POST.author.levelTag && (
                  <View style={[styles.styleTag, styles.levelTag]}>
                    <Text style={styles.levelTagText}>{MOCK_POST.author.levelTag}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.timeText}>{formatTimeAgoFromString(MOCK_POST.createdAt)}</Text>
            </View>
          </View>

          {/* 分类标签 */}
          {cat && (
            <View style={styles.catTag}>
              <Text style={styles.catTagText}>{cat.emoji} {cat.label}</Text>
            </View>
          )}

          {/* 正文 */}
          <Text style={styles.postContent}>{MOCK_POST.content}</Text>

          {/* Hashtag */}
          <View style={styles.hashtagRow}>
            {MOCK_POST.tags.map((tag) => (
              <Text key={tag} style={styles.hashtag}>{tag} </Text>
            ))}
          </View>

          {/* 视频播放器 */}
          <View style={styles.videoWrapper}>
            {/* 封面图 + 镜像效果 */}
            <Image
              source={{ uri: MOCK_POST.video.posterUrl }}
              style={[styles.videoPoster, isMirror && { transform: [{ scaleX: -1 }] }]}
              resizeMode="cover"
            />
            <View style={styles.videoOverlay} />

            {/* 播放按钮 */}
            <TouchableOpacity
              style={styles.playBtn}
              onPress={() => setIsPlaying(!isPlaying)}
              activeOpacity={0.8}
            >
              <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
            </TouchableOpacity>

            {/* 播放控件（只有在 playing 状态显示） */}
            {isPlaying && (
              <View style={styles.videoControls}>
                <TouchableOpacity
                  style={[styles.controlBtn, isSlowMo && styles.controlBtnActive]}
                  onPress={() => setIsSlowMo(!isSlowMo)}
                >
                  <Text style={[styles.controlBtnText, isSlowMo && styles.controlBtnTextActive]}>
                    0.5x 慢放
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.controlBtn, isMirror && styles.controlBtnActive]}
                  onPress={() => setIsMirror(!isMirror)}
                >
                  <Text style={[styles.controlBtnText, isMirror && styles.controlBtnTextActive]}>
                    ⇄ 镜像
                  </Text>
                </TouchableOpacity>
                {MOCK_POST.video.canDownload && (
                  <TouchableOpacity style={styles.controlBtn}>
                    <Text style={styles.controlBtnText}>⬇ 下载</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* 互动栏 */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={styles.actionCount}>{MOCK_POST.commentCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionIcon}>↗</Text>
              <Text style={styles.actionCount}>{MOCK_POST.shareCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
              <Text style={[styles.actionIcon, isLiked && styles.liked]}>{isLiked ? '♥' : '♡'}</Text>
              <Text style={[styles.actionCount, isLiked && styles.liked]}>{likeCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionIcon}>🔖</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 分割线 */}
        <View style={styles.divider} />

        {/* 评论区 */}
        <View style={styles.comments}>
          <Text style={styles.commentsTitle}>评论 {MOCK_POST.commentCount}</Text>
          {MOCK_COMMENTS.map((c) => (
            <View key={c.id} style={styles.comment}>
              <Image source={{ uri: c.avatarUrl }} style={styles.commentAvatar} />
              <View style={styles.commentBody}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentNickname}>{c.nickname}</Text>
                  <Text style={styles.commentTime}>{c.time}</Text>
                </View>
                <Text style={styles.commentText}>{c.text}</Text>
                <TouchableOpacity style={styles.commentLike}>
                  <Text style={styles.commentLikeText}>♡ {c.likes}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  navbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: '#1a1d22',
  },
  navTitle: { color: Colors.white, fontSize: 17, fontWeight: '700' },
  backBtn: { color: Colors.white, fontSize: 22 },
  moreBtn: { color: Colors.textMuted, fontSize: 20 },

  content: { padding: 16, gap: 12 },

  authorRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: '#2a2d33' },
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
  timeText: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },

  catTag: {
    alignSelf: 'flex-start', backgroundColor: '#111518',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 0.5, borderColor: '#252930',
  },
  catTagText: { color: Colors.textMuted, fontSize: 12 },

  postContent: { color: Colors.textPrimary, fontSize: 16, lineHeight: 26 },
  hashtagRow: { flexDirection: 'row', flexWrap: 'wrap' },
  hashtag: { color: '#1d9bf0', fontSize: 14 },

  // 视频
  videoWrapper: {
    width: '100%', aspectRatio: 16 / 9,
    borderRadius: 16, overflow: 'hidden',
    backgroundColor: '#111', justifyContent: 'center', alignItems: 'center',
  },
  videoPoster: { ...StyleSheet.absoluteFill },
  videoOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.3)' },
  playBtn: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)',
  },
  playIcon: { color: '#fff', fontSize: 22, marginLeft: 3 },
  videoControls: {
    position: 'absolute', bottom: 12, left: 12, right: 12,
    flexDirection: 'row', gap: 8,
  },
  controlBtn: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  controlBtnActive: { backgroundColor: Colors.white },
  controlBtnText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  controlBtnTextActive: { color: Colors.black },

  // 互动
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionIcon: { color: Colors.textMuted, fontSize: 20 },
  actionCount: { color: Colors.textMuted, fontSize: 13 },
  liked: { color: '#F91880' },

  divider: { height: 0.5, backgroundColor: '#1a1d22', marginVertical: 4 },

  // 评论
  comments: { padding: 16, gap: 16 },
  commentsTitle: { color: Colors.white, fontSize: 15, fontWeight: '800' },
  comment: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  commentAvatar: { width: 36, height: 36, borderRadius: 18 },
  commentBody: { flex: 1, gap: 4 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  commentNickname: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  commentTime: { color: Colors.textMuted, fontSize: 11 },
  commentText: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20 },
  commentLike: { alignSelf: 'flex-end' },
  commentLikeText: { color: Colors.textMuted, fontSize: 12 },
});
