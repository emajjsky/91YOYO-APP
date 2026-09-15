import { create } from 'zustand';
import { feedRepository } from '../services/feed/feedRepository';
import type { FeedScope, IFeedItem } from '../types/feed';

type FeedLoadState = 'idle' | 'loading' | 'refreshing' | 'loading_more' | 'success' | 'error';

interface FeedState {
  feedList: IFeedItem[];
  loadState: FeedLoadState;
  errorMessage: string | null;
  nextCursor: string | null;
  hasMore: boolean;
  activeScope: FeedScope;
  loadFeed: (scope: FeedScope, refresh?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  toggleLike: (postId: string) => void;
  toggleBookmark: (postId: string) => void;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  feedList: [],
  loadState: 'idle',
  errorMessage: null,
  nextCursor: null,
  hasMore: true,
  activeScope: 'public',

  loadFeed: async (scope, refresh = false) => {
    const current = get();
    if (!refresh && (current.loadState === 'loading' || current.loadState === 'refreshing')) return;

    set({
      activeScope: scope,
      loadState: refresh ? 'refreshing' : 'loading',
      errorMessage: null,
      ...(refresh ? {} : { feedList: [] }),
    });

    try {
      const page = await feedRepository.fetchFeed({ scope });
      set({
        feedList: page.items,
        nextCursor: page.nextCursor,
        hasMore: page.hasMore,
        loadState: 'success',
        errorMessage: null,
      });
    } catch (error) {
      set({
        loadState: 'error',
        errorMessage: error instanceof Error ? error.message : 'Feed 加载失败，请稍后重试',
      });
    }
  },

  loadMore: async () => {
    const current = get();
    if (current.loadState === 'loading_more' || !current.hasMore || !current.nextCursor) return;

    set({ loadState: 'loading_more', errorMessage: null });
    try {
      const page = await feedRepository.fetchFeed({
        scope: current.activeScope,
        cursor: current.nextCursor,
      });
      const knownIds = new Set(current.feedList.map((item) => item.id));
      set((state) => ({
        feedList: [...state.feedList, ...page.items.filter((item) => !knownIds.has(item.id))],
        nextCursor: page.nextCursor,
        hasMore: page.hasMore,
        loadState: 'success',
      }));
    } catch (error) {
      set({
        loadState: 'error',
        errorMessage: error instanceof Error ? error.message : '加载更多失败，请稍后重试',
      });
    }
  },

  toggleLike: (postId) => set((state) => ({
    feedList: state.feedList.map((item) => item.id === postId
      ? { ...item, isLiked: !item.isLiked, likeCount: item.likeCount + (item.isLiked ? -1 : 1) }
      : item),
  })),

  toggleBookmark: (postId) => set((state) => ({
    feedList: state.feedList.map((item) => item.id === postId
      ? { ...item, isBookmarked: !item.isBookmarked }
      : item),
  })),
}));
