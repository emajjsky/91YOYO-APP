import { create } from 'zustand';
import type { IFeedItem } from '../types/feed';

const MOCK_FEED: IFeedItem[] = [
  {
    id: 'post_101',
    author: {
      uid: 'u_1',
      nickname: '陈悠悠',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      styleTags: ['5A'],
      levelTag: '1A进阶',
    },
    content: '今天练熟了这套 5A 反向搭线连招，重头配比调到了 1:6，慢放和镜像跟着看搭线细节！⚡',
    tags: ['#5A离手', '#招式慢放求指点'],
    category: 'tutorial',
    createdAt: '10分钟前',
    video: {
      id: 'v_101',
      url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
      title: '5A Gridiron 反向翻绳连招拆解.mp4',
      posterUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
      canDownload: false,
    },
    likeCount: 48,
    commentCount: 12,
    shareCount: 6,
    isLiked: false,
    isBookmarked: false,
  },
  {
    id: 'post_102',
    author: {
      uid: 'u_2',
      nickname: 'Alex_Speed1A',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      styleTags: ['1A'],
      levelTag: 'CYSO选手',
    },
    content: '2026 全国公开赛 1A 决赛专用 3分钟卡点伴奏剪好了！BPM 132 强重音，分秒级变速卡点，备赛球友拿去练！🎵',
    tags: ['#比赛伴奏BGM', '#1A单手', '#CYSO2026'],
    category: 'music',
    createdAt: '1小时前',
    audio: {
      id: 'a_101',
      title: 'Skrillex - Bangarang (2026 CYSO 1A决赛 3分钟定制伴奏).mp3',
      bpm: 132,
      durationText: '03:00',
      src: '',
      tag: '🏆 适合 1A单手速度流 / 5A自由式',
    },
    likeCount: 89,
    commentCount: 24,
    shareCount: 31,
    isLiked: true,
    isBookmarked: true,
  },
  {
    id: 'post_103',
    author: {
      uid: 'u_3',
      nickname: '加拿大暴雪控',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
      styleTags: ['1A', '3A'],
      levelTag: '藏家',
    },
    content: '新到的 CLYW Chief 极光渐变阳极版！双金属环做工无敌，空转平稳如镜，周末带去约球！🪀',
    tags: ['#装备开箱', '#悠悠球', '#CLYW'],
    category: 'daily',
    createdAt: '3小时前',
    images: [
      { url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80', name: '极光渐变' },
      { url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80', name: '金属环细节' },
      { url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80', name: '侧轴微距' },
    ],
    likeCount: 135,
    commentCount: 19,
    shareCount: 8,
    isLiked: false,
    isBookmarked: false,
  },
];

interface FeedState {
  feedList: IFeedItem[];
  addPost: (post: IFeedItem) => void;
  toggleLike: (postId: string) => void;
  toggleBookmark: (postId: string) => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  feedList: MOCK_FEED,

  addPost: (post) =>
    set((state) => ({ feedList: [post, ...state.feedList] })),

  toggleLike: (postId) =>
    set((state) => ({
      feedList: state.feedList.map((item) =>
        item.id === postId
          ? { ...item, isLiked: !item.isLiked, likeCount: item.likeCount + (item.isLiked ? -1 : 1) }
          : item
      ),
    })),

  toggleBookmark: (postId) =>
    set((state) => ({
      feedList: state.feedList.map((item) =>
        item.id === postId ? { ...item, isBookmarked: !item.isBookmarked } : item
      ),
    })),
}));
