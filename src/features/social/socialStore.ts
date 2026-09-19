import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from 'zustand';
import { createStore, type StoreApi } from 'zustand/vanilla';
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from 'zustand/middleware';
import { POST_CATEGORIES, STYLE_TAGS } from '../../constants/categories';
import {
  createMockContentRepository,
  type ContentPage,
  type ContentRepository,
  type FeedMode,
} from './contentRepository';
import { currentViewer } from './mockProfiles';
import { mockUsers } from './mockUsers';
import type { SocialPost, SocialUser } from './types';

export type FeedLoadState =
  | 'idle'
  | 'loading'
  | 'refreshing'
  | 'loading_more'
  | 'success'
  | 'error';

export interface SocialFeedState {
  ids: string[];
  nextCursor: string | null;
  hasMore: boolean;
  loadState: FeedLoadState;
  errorMessage: string | null;
}

export interface SocialState {
  feeds: Record<FeedMode, SocialFeedState>;
  postsById: Record<string, SocialPost>;
  usersById: Record<string, SocialUser>;
  recommendationReasonsByPostId: Record<string, string | null>;
  likedPostIds: string[];
  bookmarkedPostIds: string[];
  followedUserIds: string[];
  createdPostsById: Record<string, SocialPost>;
  loadFeed(mode: FeedMode, refresh?: boolean): Promise<void>;
  loadMore(mode: FeedMode): Promise<void>;
  toggleLike(postId: string): void;
  toggleBookmark(postId: string): void;
  toggleFollow(userId: string): void;
  resetDemoData(): Promise<void>;
}

type PersistedSocialState = Pick<
  SocialState,
  'likedPostIds' | 'bookmarkedPostIds' | 'followedUserIds' | 'createdPostsById'
>;

export type SocialStore = StoreApi<SocialState> & {
  persist: {
    clearStorage(): void | Promise<void>;
    rehydrate(): void | Promise<void>;
    hasHydrated(): boolean;
  };
};

const STORAGE_KEY = '91yoyo-social-state';
const DEFAULT_ERROR_MESSAGE = '内容加载失败，请稍后重试';
const CANONICAL_ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const CATEGORY_IDS = new Set<string>(POST_CATEGORIES.map(({ id }) => id));
const STYLE_TAG_IDS = new Set<string>(STYLE_TAGS);

function createFeedState(): SocialFeedState {
  return {
    ids: [],
    nextCursor: null,
    hasMore: true,
    loadState: 'idle',
    errorMessage: null,
  };
}

function createFeeds(): Record<FeedMode, SocialFeedState> {
  return {
    recommended: createFeedState(),
    following: createFeedState(),
  };
}

function uniqueStrings(value: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(value)) return [...fallback];
  return [...new Set(value.filter((item): item is string => typeof item === 'string'))];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isFiniteNonnegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isFinitePositive(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isAssetUri(value: unknown): value is number | string {
  return typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value));
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isCanonicalIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string' || !CANONICAL_ISO_TIMESTAMP.test(value)) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value;
}

function hasVideoBaseFields(value: Record<string, unknown>): boolean {
  return (
    typeof value.id === 'string' &&
    isAssetUri(value.posterUri) &&
    isFinitePositive(value.aspectRatio) &&
    typeof value.title === 'string'
  );
}

function isMediaContent(value: unknown): value is SocialPost['media'] {
  if (!isRecord(value) || typeof value.type !== 'string') return false;

  switch (value.type) {
    case 'none':
      return true;
    case 'images':
      return Array.isArray(value.assets) && value.assets.every((asset) =>
        isRecord(asset) &&
        typeof asset.id === 'string' &&
        isAssetUri(asset.uri) &&
        isFinitePositive(asset.aspectRatio) &&
        typeof asset.alt === 'string',
      );
    case 'video': {
      if (!isRecord(value.asset) || !hasVideoBaseFields(value.asset)) return false;
      if (value.asset.playbackStatus === 'reserved') {
        return value.asset.durationSeconds === null && !('uri' in value.asset);
      }
      if (value.asset.playbackStatus === 'ready') {
        return isAssetUri(value.asset.uri) && isFiniteNonnegative(value.asset.durationSeconds);
      }
      return false;
    }
    case 'audio':
      return (
        isRecord(value.asset) &&
        typeof value.asset.id === 'string' &&
        isAssetUri(value.asset.uri) &&
        isAssetUri(value.asset.coverUri) &&
        typeof value.asset.title === 'string' &&
        typeof value.asset.artist === 'string' &&
        isFiniteNonnegative(value.asset.bpm) &&
        isFiniteNonnegative(value.asset.durationSeconds)
      );
    default:
      return false;
  }
}

function isSocialPost(value: unknown): value is SocialPost {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.authorId === 'string' &&
    typeof value.content === 'string' &&
    typeof value.category === 'string' &&
    CATEGORY_IDS.has(value.category) &&
    isStringArray(value.styleTags) &&
    value.styleTags.every((style) => STYLE_TAG_IDS.has(style)) &&
    isStringArray(value.hashtags) &&
    isCanonicalIsoTimestamp(value.createdAt) &&
    isMediaContent(value.media) &&
    isFiniteNonnegative(value.likeCount) &&
    isFiniteNonnegative(value.commentCount) &&
    isFiniteNonnegative(value.shareCount) &&
    isFiniteNonnegative(value.viewCount) &&
    (value.visibility === 'public' || value.visibility === 'followers')
  );
}

function sanitizeCreatedPosts(value: unknown): Record<string, SocialPost> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, SocialPost] =>
        isSocialPost(entry[1]) && entry[0] === entry[1].id,
    ),
  );
}

function sanitizePersistedState(value: unknown): PersistedSocialState {
  const candidate = value && typeof value === 'object' ? value as Record<string, unknown> : {};

  return {
    likedPostIds: uniqueStrings(candidate.likedPostIds),
    bookmarkedPostIds: uniqueStrings(candidate.bookmarkedPostIds),
    followedUserIds: uniqueStrings(candidate.followedUserIds, currentViewer.followedUserIds),
    createdPostsById: sanitizeCreatedPosts(candidate.createdPostsById),
  };
}

function sameIds(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((id) => right.includes(id));
}

function isDefaultPersistedValue(value: string): boolean {
  try {
    const parsed = JSON.parse(value) as { state?: unknown };
    const state = sanitizePersistedState(parsed.state);
    return (
      state.likedPostIds.length === 0 &&
      state.bookmarkedPostIds.length === 0 &&
      sameIds(state.followedUserIds, currentViewer.followedUserIds) &&
      Object.keys(state.createdPostsById).length === 0
    );
  } catch {
    return false;
  }
}

function createEpochStorage(storage: StateStorage): StateStorage {
  let epoch = 0;

  return {
    async getItem(name) {
      const readEpoch = epoch;
      const value = await storage.getItem(name);
      return readEpoch === epoch ? value : null;
    },
    setItem(name, value) {
      if (isDefaultPersistedValue(value)) return storage.removeItem(name);
      return storage.setItem(name, value);
    },
    removeItem(name) {
      epoch += 1;
      return storage.removeItem(name);
    },
  };
}

function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

function appendUnique(existing: string[], incoming: string[]): string[] {
  const seen = new Set(existing);
  return [...existing, ...incoming.filter((id) => !seen.has(id) && Boolean(seen.add(id)))];
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE;
}

function userRecordsFor(page: ContentPage): Record<string, SocialUser> {
  const authorIds = new Set(page.items.map(({ post }) => post.authorId));
  return Object.fromEntries(
    mockUsers.filter((user) => authorIds.has(user.id)).map((user) => [user.id, user]),
  );
}

function normalizePage(
  page: ContentPage,
  likedPostIds: string[],
): {
  ids: string[];
  postsById: Record<string, SocialPost>;
  usersById: Record<string, SocialUser>;
  reasonsByPostId: Record<string, string | null>;
} {
  const likedIds = new Set(likedPostIds);
  const ids: string[] = [];
  const postsById: Record<string, SocialPost> = {};
  const reasonsByPostId: Record<string, string | null> = {};

  for (const item of page.items) {
    if (!postsById[item.post.id]) ids.push(item.post.id);
    postsById[item.post.id] = {
      ...item.post,
      likeCount: Math.max(0, item.post.likeCount + (likedIds.has(item.post.id) ? 1 : 0)),
    };
    reasonsByPostId[item.post.id] = item.reason;
  }

  return {
    ids,
    postsById,
    usersById: userRecordsFor(page),
    reasonsByPostId,
  };
}

export function createSocialStore(
  repository: ContentRepository,
  storage: StateStorage,
): SocialStore {
  let lifecycleEpoch = 0;
  let initialHydration: Promise<void> = Promise.resolve();
  const requestVersions: Record<FeedMode, number> = { recommended: 0, following: 0 };
  const activeRequests: Record<FeedMode, { kind: 'initial' | 'refresh' | 'more'; promise: Promise<void> } | null> = {
    recommended: null,
    following: null,
  };

  const store = createStore<SocialState>()(
    persist(
      (set, get) => {
        const fetchFeed = (
          mode: FeedMode,
          kind: 'initial' | 'refresh' | 'more',
        ): Promise<void> => {
          const activeRequest = activeRequests[mode];

          if (activeRequest && activeRequest.kind === kind) return activeRequest.promise;
          if (kind === 'initial' && activeRequest) return activeRequest.promise;
          if (kind === 'more' && activeRequest) {
            return Promise.resolve();
          }

          const version = ++requestVersions[mode];
          const requestEpoch = lifecycleEpoch;
          const promise = (async () => {
            await initialHydration;
            if (requestEpoch !== lifecycleEpoch || version !== requestVersions[mode]) return;

            const currentFeed = get().feeds[mode];
            if (kind === 'more' && (!currentFeed.hasMore || !currentFeed.nextCursor)) return;
            const cursor = kind === 'more' ? currentFeed.nextCursor : null;

            set((state) => ({
              feeds: {
                ...state.feeds,
                [mode]: {
                  ...state.feeds[mode],
                  loadState: kind === 'refresh' ? 'refreshing' : kind === 'more' ? 'loading_more' : 'loading',
                  errorMessage: null,
                },
              },
            }));

            try {
              const page = await repository.getFeed({ mode, cursor });
              if (version !== requestVersions[mode]) return;

              set((state) => {
                const normalized = normalizePage(page, state.likedPostIds);
                const visibleIds = mode === 'following'
                  ? normalized.ids.filter((postId) =>
                      state.followedUserIds.includes(normalized.postsById[postId].authorId),
                    )
                  : normalized.ids;
                const ids = kind === 'more'
                  ? appendUnique(state.feeds[mode].ids, visibleIds)
                  : visibleIds;

                return {
                  feeds: {
                    ...state.feeds,
                    [mode]: {
                      ids,
                      nextCursor: page.nextCursor,
                      hasMore: page.hasMore,
                      loadState: 'success',
                      errorMessage: null,
                    },
                  },
                  postsById: { ...state.postsById, ...normalized.postsById },
                  usersById: { ...state.usersById, ...normalized.usersById },
                  recommendationReasonsByPostId: {
                    ...state.recommendationReasonsByPostId,
                    ...normalized.reasonsByPostId,
                  },
                };
              });
            } catch (error) {
              if (version !== requestVersions[mode]) return;
              set((state) => ({
                feeds: {
                  ...state.feeds,
                  [mode]: {
                    ...state.feeds[mode],
                    loadState: 'error',
                    errorMessage: errorMessage(error),
                  },
                },
              }));
            } finally {
              if (version === requestVersions[mode]) activeRequests[mode] = null;
            }
          })();

          activeRequests[mode] = { kind, promise };
          return promise;
        };

        return {
          feeds: createFeeds(),
          postsById: {},
          usersById: {},
          recommendationReasonsByPostId: {},
          likedPostIds: [],
          bookmarkedPostIds: [],
          followedUserIds: [...currentViewer.followedUserIds],
          createdPostsById: {},

          loadFeed: (mode, refresh = false) => fetchFeed(mode, refresh ? 'refresh' : 'initial'),
          loadMore: (mode) => fetchFeed(mode, 'more'),

          toggleLike: (postId) => set((state) => {
            const wasLiked = state.likedPostIds.includes(postId);
            const loadedPost = state.postsById[postId];
            const updatedPost = loadedPost
              ? { ...loadedPost, likeCount: Math.max(0, loadedPost.likeCount + (wasLiked ? -1 : 1)) }
              : undefined;

            return {
              likedPostIds: toggleId(state.likedPostIds, postId),
              postsById: updatedPost
                ? { ...state.postsById, [postId]: updatedPost }
                : state.postsById,
              createdPostsById: updatedPost && state.createdPostsById[postId]
                ? { ...state.createdPostsById, [postId]: updatedPost }
                : state.createdPostsById,
            };
          }),

          toggleBookmark: (postId) => set((state) => ({
            bookmarkedPostIds: toggleId(state.bookmarkedPostIds, postId),
          })),

          toggleFollow: (userId) => set((state) => {
            const wasFollowed = state.followedUserIds.includes(userId);
            return {
              followedUserIds: toggleId(state.followedUserIds, userId),
              feeds: wasFollowed
                ? {
                    ...state.feeds,
                    following: {
                      ...state.feeds.following,
                      ids: state.feeds.following.ids.filter(
                        (postId) => state.postsById[postId]?.authorId !== userId,
                      ),
                    },
                  }
                : state.feeds,
            };
          }),

          resetDemoData: async () => {
            lifecycleEpoch += 1;
            requestVersions.recommended += 1;
            requestVersions.following += 1;
            activeRequests.recommended = null;
            activeRequests.following = null;
            await store.persist.clearStorage();
            set({
              feeds: createFeeds(),
              postsById: {},
              usersById: {},
              recommendationReasonsByPostId: {},
              likedPostIds: [],
              bookmarkedPostIds: [],
              followedUserIds: [...currentViewer.followedUserIds],
              createdPostsById: {},
            });
            await store.persist.clearStorage();
          },
        };
      },
      {
        name: STORAGE_KEY,
        version: 1,
        storage: createJSONStorage(() => createEpochStorage(storage)),
        skipHydration: true,
        partialize: (state): PersistedSocialState => ({
          likedPostIds: state.likedPostIds,
          bookmarkedPostIds: state.bookmarkedPostIds,
          followedUserIds: state.followedUserIds,
          createdPostsById: state.createdPostsById,
        }),
        merge: (persistedState, currentState) => {
          const persisted = sanitizePersistedState(persistedState);
          const createdAuthors = new Set(
            Object.values(persisted.createdPostsById).map((post) => post.authorId),
          );

          return {
            ...currentState,
            ...persisted,
            postsById: {
              ...currentState.postsById,
              ...persisted.createdPostsById,
            },
            usersById: {
              ...currentState.usersById,
              ...Object.fromEntries(
                mockUsers
                  .filter((user) => createdAuthors.has(user.id))
                  .map((user) => [user.id, user]),
              ),
            },
          };
        },
      },
    ),
  );

  initialHydration = Promise.resolve(store.persist.rehydrate()).then(() => undefined);

  return store as SocialStore;
}

const productionStore = createSocialStore(
  createMockContentRepository(),
  AsyncStorage,
);

type SocialStoreHook = {
  (): SocialState;
  <T>(selector: (state: SocialState) => T): T;
} & SocialStore;

export const useSocialStore = Object.assign(
  <T>(selector?: (state: SocialState) => T) =>
    useStore(productionStore, selector ?? ((state) => state as T)),
  productionStore,
) as SocialStoreHook;
