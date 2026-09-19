import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from 'zustand';
import { createStore, type StoreApi } from 'zustand/vanilla';
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from 'zustand/middleware';
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

function isSocialPost(value: unknown): value is SocialPost {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const candidate = value as Partial<SocialPost>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.authorId === 'string' &&
    typeof candidate.content === 'string' &&
    typeof candidate.likeCount === 'number'
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
          const currentFeed = get().feeds[mode];
          const activeRequest = activeRequests[mode];

          if (activeRequest && activeRequest.kind === kind) return activeRequest.promise;
          if (kind === 'initial' && activeRequest) return activeRequest.promise;
          if (kind === 'more' && (activeRequest || !currentFeed.hasMore || !currentFeed.nextCursor)) {
            return Promise.resolve();
          }

          const version = ++requestVersions[mode];
          const cursor = kind === 'more' ? currentFeed.nextCursor : null;
          const promise = (async () => {
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
        storage: createJSONStorage(() => storage),
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
