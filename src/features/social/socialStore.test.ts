import { createRequire } from 'node:module';

import type { StateStorage } from 'zustand/middleware';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type {
  ContentPage,
  ContentRepository,
  FeedMode,
} from './contentRepository';
import { currentViewer } from './mockProfiles';
import type { SocialPost } from './types';

const STORAGE_KEY = '91yoyo-social-state';
const runtimeRequire = createRequire(import.meta.url);
const previousJpgHandler = runtimeRequire.extensions['.jpg'];
const previousWavHandler = runtimeRequire.extensions['.wav'];
const loadAsset = (module: NodeModule) => {
  module.exports = 1;
};

runtimeRequire.extensions['.jpg'] = loadAsset;
runtimeRequire.extensions['.wav'] = loadAsset;

let createSocialStore: typeof import('./socialStore').createSocialStore;

beforeAll(async () => {
  ({ createSocialStore } = await import('./socialStore'));
});

afterAll(() => {
  if (previousJpgHandler) {
    runtimeRequire.extensions['.jpg'] = previousJpgHandler;
  } else {
    delete runtimeRequire.extensions['.jpg'];
  }

  if (previousWavHandler) {
    runtimeRequire.extensions['.wav'] = previousWavHandler;
  } else {
    delete runtimeRequire.extensions['.wav'];
  }
});

function post(postId: string): SocialPost {
  const authorByPostId: Record<string, string> = {
    'post-contest-final-runthrough': 'user-chen',
    'post-tutorial-5a-direction-change': 'user-xiaoyu',
    'post-music-speed-combo': 'user-leo',
    'post-daily-first-metal-yoyo': 'user-lin',
  };

  return {
    id: postId,
    authorId: authorByPostId[postId] ?? 'user-chen',
    content: `Content for ${postId}`,
    category: 'daily',
    styleTags: ['1A'],
    hashtags: ['#1A'],
    createdAt: '2026-09-15T12:00:00.000Z',
    media: { type: 'none' },
    likeCount: 10,
    commentCount: 2,
    shareCount: 1,
    viewCount: 100,
    visibility: 'public',
  };
}

function ranked(postValue: SocialPost, reason: string | null = null) {
  return { post: postValue, score: 0.5, reason };
}

function page(
  items: SocialPost[],
  options: { nextCursor?: string | null; hasMore?: boolean } = {},
): ContentPage {
  return {
    items: items.map((item) => ranked(item)),
    nextCursor: options.nextCursor ?? null,
    hasMore: options.hasMore ?? false,
  };
}

function createMemoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  const storage: StateStorage = {
    getItem: (name) => values.get(name) ?? null,
    setItem: (name, value) => {
      values.set(name, value);
    },
    removeItem: (name) => {
      values.delete(name);
    },
  };

  return { storage, values };
}

function createDeferredReadStorage(storedValue: string | null) {
  const read = deferred<string | null>();
  const values = new Map<string, string>();
  const storage: StateStorage = {
    getItem: () => read.promise,
    setItem: (name, value) => {
      values.set(name, value);
    },
    removeItem: (name) => {
      values.delete(name);
    },
  };

  return {
    storage,
    values,
    resolveRead: () => read.resolve(storedValue),
  };
}

function persistedState(state: Record<string, unknown>): string {
  return JSON.stringify({ state, version: 1 });
}

async function waitForAutomaticHydration(store: ReturnType<typeof createSocialStore>) {
  for (let attempt = 0; attempt < 20 && !store.persist.hasHydrated(); attempt += 1) {
    await Promise.resolve();
  }

  expect(store.persist.hasHydrated()).toBe(true);
}

type PageKey = `${FeedMode}:${string}`;

function createZeroLatencyRepository(pages: Partial<Record<PageKey, ContentPage>>) {
  const requests: { mode: FeedMode; cursor: string | null }[] = [];
  const repository: ContentRepository = {
    async getFeed({ mode, cursor = null }) {
      requests.push({ mode, cursor });
      const result = pages[`${mode}:${cursor ?? 'first'}`];
      if (!result) throw new Error(`Unexpected page: ${mode}:${cursor ?? 'first'}`);
      return result;
    },
    async getPost(postId) {
      return post(postId);
    },
  };

  return { repository, requests };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

describe('socialStore', () => {
  it('falls back to default state when persisted storage cannot be read', async () => {
    const fixturePost = post('post-music-speed-combo');
    const { repository } = createZeroLatencyRepository({
      'recommended:first': page([fixturePost]),
    });
    const storage: StateStorage = {
      getItem: async () => {
        throw new Error('storage unavailable');
      },
      setItem: () => undefined,
      removeItem: () => undefined,
    };
    const store = createSocialStore(repository, storage);

    await expect(store.getState().loadFeed('recommended')).resolves.toBeUndefined();

    expect(store.getState().feeds.recommended).toMatchObject({
      ids: [fixturePost.id],
      loadState: 'success',
      errorMessage: null,
    });
    expect(store.getState().likedPostIds).toEqual([]);
    expect(store.getState().followedUserIds).toEqual(currentViewer.followedUserIds);
  });

  it('hydrates interactions before zero-latency feeds commit derived state', async () => {
    const likedPost = post('post-music-speed-combo');
    const unfollowedPost = post('post-contest-final-runthrough');
    const followedPost = post('post-tutorial-5a-direction-change');
    const storage = createDeferredReadStorage(persistedState({
      likedPostIds: [likedPost.id],
      bookmarkedPostIds: [],
      followedUserIds: [followedPost.authorId],
      createdPostsById: {},
    }));
    const { repository, requests } = createZeroLatencyRepository({
      'recommended:first': page([likedPost]),
      'following:first': page([unfollowedPost, followedPost]),
    });
    const store = createSocialStore(repository, storage.storage);

    const recommendedLoad = store.getState().loadFeed('recommended');
    const followingLoad = store.getState().loadFeed('following');
    expect(requests).toEqual([]);

    storage.resolveRead();
    await Promise.all([recommendedLoad, followingLoad]);

    expect(store.getState().postsById[likedPost.id].likeCount).toBe(likedPost.likeCount + 1);
    expect(store.getState().feeds.following.ids).toEqual([followedPost.id]);

    await store.getState().loadFeed('recommended', true);
    expect(store.getState().postsById[likedPost.id].likeCount).toBe(likedPost.likeCount + 1);
  });

  it('does not restore a stale hydration read after reset', async () => {
    const fixturePost = post('post-music-speed-combo');
    const storage = createDeferredReadStorage(persistedState({
      likedPostIds: [fixturePost.id],
      bookmarkedPostIds: [fixturePost.id],
      followedUserIds: ['user-leo'],
      createdPostsById: {},
    }));
    const { repository } = createZeroLatencyRepository({
      'recommended:first': page([fixturePost]),
    });
    const store = createSocialStore(repository, storage.storage);

    const reset = store.getState().resetDemoData();
    storage.resolveRead();
    await reset;
    await store.getState().loadFeed('recommended');

    expect(store.getState().likedPostIds).toEqual([]);
    expect(store.getState().bookmarkedPostIds).toEqual([]);
    expect(store.getState().followedUserIds).toEqual(currentViewer.followedUserIds);
    expect(store.getState().postsById[fixturePost.id].likeCount).toBe(fixturePost.likeCount);
    expect(storage.values.has(STORAGE_KEY)).toBe(false);
  });

  it('keeps feed pages and request state separate while normalizing records', async () => {
    const recommendedPost = post('post-music-speed-combo');
    const followingPost = post('post-contest-final-runthrough');
    const { repository } = createZeroLatencyRepository({
      'recommended:first': page([recommendedPost], { nextCursor: 'rec:1', hasMore: true }),
      'following:first': page([followingPost]),
    });
    const store = createSocialStore(repository, createMemoryStorage().storage);

    await Promise.all([
      store.getState().loadFeed('recommended'),
      store.getState().loadFeed('following'),
    ]);

    expect(store.getState().feeds.recommended).toMatchObject({
      ids: [recommendedPost.id],
      nextCursor: 'rec:1',
      hasMore: true,
      loadState: 'success',
      errorMessage: null,
    });
    expect(store.getState().feeds.following).toMatchObject({
      ids: [followingPost.id],
      nextCursor: null,
      hasMore: false,
      loadState: 'success',
      errorMessage: null,
    });
    expect(Object.keys(store.getState().postsById).sort()).toEqual(
      [followingPost.id, recommendedPost.id].sort(),
    );
    expect(Object.keys(store.getState().usersById).sort()).toEqual(
      [followingPost.authorId, recommendedPost.authorId].sort(),
    );
  });

  it('deduplicates IDs when pagination overlaps an earlier page', async () => {
    const first = post('post-contest-final-runthrough');
    const overlap = post('post-tutorial-5a-direction-change');
    const last = post('post-music-speed-combo');
    const { repository } = createZeroLatencyRepository({
      'recommended:first': page([first, overlap], { nextCursor: 'rec:2', hasMore: true }),
      'recommended:rec:2': page([overlap, last]),
    });
    const store = createSocialStore(repository, createMemoryStorage().storage);

    await store.getState().loadFeed('recommended');
    await store.getState().loadMore('recommended');
    await store.getState().loadMore('recommended');

    expect(store.getState().feeds.recommended.ids).toEqual([first.id, overlap.id, last.id]);
  });

  it('changes a like count exactly once per toggle and never below zero', async () => {
    const zeroLikePost = { ...post('post-daily-first-metal-yoyo'), id: 'post-zero-likes', likeCount: 0 };
    const { repository } = createZeroLatencyRepository({
      'recommended:first': page([zeroLikePost]),
    });
    const store = createSocialStore(repository, createMemoryStorage().storage);
    await store.getState().loadFeed('recommended');

    store.getState().toggleLike(zeroLikePost.id);
    expect(store.getState().postsById[zeroLikePost.id].likeCount).toBe(1);
    expect(store.getState().likedPostIds).toEqual([zeroLikePost.id]);

    store.getState().toggleLike(zeroLikePost.id);
    expect(store.getState().postsById[zeroLikePost.id].likeCount).toBe(0);
    expect(store.getState().likedPostIds).toEqual([]);
  });

  it('toggles a bookmark once per invocation without duplicate IDs', async () => {
    const bookmarkedPost = post('post-music-speed-combo');
    const { repository } = createZeroLatencyRepository({
      'recommended:first': page([bookmarkedPost]),
    });
    const store = createSocialStore(repository, createMemoryStorage().storage);
    await store.getState().loadFeed('recommended');

    store.getState().toggleBookmark(bookmarkedPost.id);
    expect(store.getState().bookmarkedPostIds).toEqual([bookmarkedPost.id]);

    store.getState().toggleBookmark(bookmarkedPost.id);
    expect(store.getState().bookmarkedPostIds).toEqual([]);
  });

  it('removes unfollowed authors immediately and restores them after refollow refresh', async () => {
    const chenPost = post('post-contest-final-runthrough');
    const xiaoyuPost = post('post-tutorial-5a-direction-change');
    const { repository } = createZeroLatencyRepository({
      'following:first': page([chenPost, xiaoyuPost]),
    });
    const store = createSocialStore(repository, createMemoryStorage().storage);
    await store.getState().loadFeed('following');

    store.getState().toggleFollow(chenPost.authorId);
    expect(store.getState().feeds.following.ids).toEqual([xiaoyuPost.id]);

    await store.getState().loadFeed('following', true);
    expect(store.getState().feeds.following.ids).toEqual([xiaoyuPost.id]);

    store.getState().toggleFollow(chenPost.authorId);
    expect(store.getState().feeds.following.ids).toEqual([xiaoyuPost.id]);

    await store.getState().loadFeed('following', true);
    expect(store.getState().feeds.following.ids).toEqual([chenPost.id, xiaoyuPost.id]);
  });

  it('rehydrates interactions and applies persisted likes when records load', async () => {
    const likedPost = post('post-music-speed-combo');
    const { repository } = createZeroLatencyRepository({
      'recommended:first': page([likedPost]),
    });
    const memory = createMemoryStorage();
    const firstStore = createSocialStore(repository, memory.storage);
    await firstStore.getState().loadFeed('recommended');
    firstStore.getState().toggleLike(likedPost.id);
    firstStore.getState().toggleBookmark(likedPost.id);
    firstStore.getState().toggleFollow('user-leo');

    const restoredStore = createSocialStore(repository, memory.storage);
    await waitForAutomaticHydration(restoredStore);

    expect(restoredStore.getState().likedPostIds).toEqual([likedPost.id]);
    expect(restoredStore.getState().bookmarkedPostIds).toEqual([likedPost.id]);
    expect(restoredStore.getState().followedUserIds).toContain('user-leo');

    await restoredStore.getState().loadFeed('recommended');
    expect(restoredStore.getState().postsById[likedPost.id].likeCount).toBe(likedPost.likeCount + 1);
  });

  it('persists only interactions and user-created posts', async () => {
    const fixturePost = post('post-music-speed-combo');
    const createdPost = { ...fixturePost, id: 'created-post-1' };
    const { repository } = createZeroLatencyRepository({
      'recommended:first': page([fixturePost], { nextCursor: 'rec:1', hasMore: true }),
    });
    const memory = createMemoryStorage();
    const store = createSocialStore(repository, memory.storage);
    await store.getState().loadFeed('recommended');
    store.setState((state) => ({
      createdPostsById: { [createdPost.id]: createdPost },
      postsById: { ...state.postsById, [createdPost.id]: createdPost },
    }));
    store.getState().toggleBookmark(fixturePost.id);

    const persisted = JSON.parse(memory.values.get(STORAGE_KEY) ?? '{}') as {
      state?: Record<string, unknown>;
    };

    expect(Object.keys(persisted.state ?? {}).sort()).toEqual([
      'bookmarkedPostIds',
      'createdPostsById',
      'followedUserIds',
      'likedPostIds',
    ]);
    expect(persisted.state?.createdPostsById).toEqual({ [createdPost.id]: createdPost });
  });

  it('restores user-created posts into the normalized post records', async () => {
    const createdPost = { ...post('post-daily-first-metal-yoyo'), id: 'created-post-2' };
    const { repository } = createZeroLatencyRepository({});
    const memory = createMemoryStorage();
    const firstStore = createSocialStore(repository, memory.storage);
    firstStore.setState({
      createdPostsById: { [createdPost.id]: createdPost },
      postsById: { [createdPost.id]: createdPost },
    });

    const restoredStore = createSocialStore(repository, memory.storage);
    await waitForAutomaticHydration(restoredStore);

    expect(restoredStore.getState().createdPostsById).toEqual({
      [createdPost.id]: createdPost,
    });
    expect(restoredStore.getState().postsById).toEqual({
      [createdPost.id]: createdPost,
    });
  });

  it('deduplicates persisted arrays and ignores invalid persisted shapes', async () => {
    const likedPost = post('post-music-speed-combo');
    const memory = createMemoryStorage({
      [STORAGE_KEY]: JSON.stringify({
        state: {
          likedPostIds: [likedPost.id, 7, likedPost.id, null],
          bookmarkedPostIds: 'invalid',
          followedUserIds: ['user-chen', 'user-chen', {}, 'user-xiaoyu'],
          createdPostsById: [],
          feeds: { recommended: { ids: ['poisoned'] } },
          postsById: { poisoned: likedPost },
        },
        version: 1,
      }),
    });
    const { repository } = createZeroLatencyRepository({
      'recommended:first': page([likedPost]),
    });
    const store = createSocialStore(repository, memory.storage);
    await waitForAutomaticHydration(store);

    expect(store.getState().likedPostIds).toEqual([likedPost.id]);
    expect(store.getState().bookmarkedPostIds).toEqual([]);
    expect(store.getState().followedUserIds).toEqual(['user-chen', 'user-xiaoyu']);
    expect(store.getState().feeds.recommended.ids).toEqual([]);
    expect(store.getState().postsById).toEqual({});
  });

  it('restores only created posts that satisfy the complete SocialPost contract', async () => {
    const validPost = { ...post('post-daily-first-metal-yoyo'), id: 'created-valid' };
    const { media: _missingMedia, ...missingMedia } = {
      ...validPost,
      id: 'created-missing-media',
    };
    const malformedImages = {
      ...validPost,
      id: 'created-bad-images',
      media: {
        type: 'images',
        assets: [{ id: 'image-1', uri: {}, aspectRatio: 'wide', alt: 4 }],
      },
    };
    const malformedReservedVideo = {
      ...validPost,
      id: 'created-bad-reserved-video',
      media: {
        type: 'video',
        asset: {
          id: 'video-1',
          playbackStatus: 'reserved',
          uri: 'unexpected.mp4',
          posterUri: 'poster.jpg',
          durationSeconds: 12,
          aspectRatio: 1.5,
          title: 'Reserved video',
        },
      },
    };
    const malformedReadyVideo = {
      ...validPost,
      id: 'created-bad-ready-video',
      media: {
        type: 'video',
        asset: {
          id: 'video-2',
          playbackStatus: 'ready',
          posterUri: 'poster.jpg',
          durationSeconds: null,
          aspectRatio: 1.5,
          title: 'Ready video',
        },
      },
    };
    const malformedAudio = {
      ...validPost,
      id: 'created-bad-audio',
      media: {
        type: 'audio',
        asset: {
          id: 'audio-1',
          uri: 'audio.wav',
          coverUri: 'cover.jpg',
          title: 'Audio',
          artist: 'Artist',
          bpm: -1,
          durationSeconds: 12,
        },
      },
    };
    const malformedDomainFields = {
      ...validPost,
      id: 'created-bad-domain',
      category: 'unknown',
      styleTags: ['6A'],
      hashtags: ['#valid', 7],
      createdAt: 'yesterday',
      likeCount: Number.POSITIVE_INFINITY,
      commentCount: -1,
      visibility: 'friends',
    };
    const keyMismatch = { ...validPost, id: 'different-id' };
    const memory = createMemoryStorage({
      [STORAGE_KEY]: persistedState({
        likedPostIds: [],
        bookmarkedPostIds: [],
        followedUserIds: currentViewer.followedUserIds,
        createdPostsById: {
          [validPost.id]: validPost,
          [missingMedia.id]: missingMedia,
          [malformedImages.id]: malformedImages,
          [malformedReservedVideo.id]: malformedReservedVideo,
          [malformedReadyVideo.id]: malformedReadyVideo,
          [malformedAudio.id]: malformedAudio,
          [malformedDomainFields.id]: malformedDomainFields,
          'created-key-mismatch': keyMismatch,
        },
      }),
    });
    const { repository } = createZeroLatencyRepository({});
    const store = createSocialStore(repository, memory.storage);
    await waitForAutomaticHydration(store);

    expect(store.getState().createdPostsById).toEqual({
      [validPost.id]: validPost,
    });
    expect(store.getState().postsById).toEqual({
      [validPost.id]: validPost,
    });
  });

  it('ignores a stale load-more response after a refresh completes', async () => {
    const initialPost = post('post-contest-final-runthrough');
    const stalePost = post('post-tutorial-5a-direction-change');
    const refreshedPost = post('post-music-speed-combo');
    const loadMoreResult = deferred<ContentPage>();
    const refreshResult = deferred<ContentPage>();
    let firstPageLoaded = false;
    const repository: ContentRepository = {
      async getFeed({ cursor }) {
        if (!firstPageLoaded) {
          firstPageLoaded = true;
          return page([initialPost], { nextCursor: 'rec:1', hasMore: true });
        }
        return cursor ? loadMoreResult.promise : refreshResult.promise;
      },
      async getPost() {
        return null;
      },
    };
    const store = createSocialStore(repository, createMemoryStorage().storage);
    await store.getState().loadFeed('recommended');

    const loadMorePromise = store.getState().loadMore('recommended');
    const refreshPromise = store.getState().loadFeed('recommended', true);
    refreshResult.resolve(page([refreshedPost]));
    await refreshPromise;
    loadMoreResult.resolve(page([stalePost]));
    await loadMorePromise;

    expect(store.getState().feeds.recommended.ids).toEqual([refreshedPost.id]);
    expect(store.getState().feeds.recommended.loadState).toBe('success');
  });

  it('coalesces duplicate concurrent requests for the same feed', async () => {
    const result = deferred<ContentPage>();
    let requestCount = 0;
    const repository: ContentRepository = {
      async getFeed() {
        requestCount += 1;
        return result.promise;
      },
      async getPost() {
        return null;
      },
    };
    const store = createSocialStore(repository, createMemoryStorage().storage);

    const firstRequest = store.getState().loadFeed('recommended');
    const duplicateRequest = store.getState().loadFeed('recommended');
    result.resolve(page([post('post-music-speed-combo')]));
    await Promise.all([firstRequest, duplicateRequest]);

    expect(requestCount).toBe(1);
    expect(store.getState().feeds.recommended.ids).toEqual(['post-music-speed-combo']);
  });

  it('stores errors per mode without disturbing the other feed', async () => {
    const followingPost = post('post-contest-final-runthrough');
    const repository: ContentRepository = {
      async getFeed({ mode }) {
        if (mode === 'recommended') throw new Error('推荐流失败');
        return page([followingPost]);
      },
      async getPost() {
        return null;
      },
    };
    const store = createSocialStore(repository, createMemoryStorage().storage);

    await Promise.all([
      store.getState().loadFeed('recommended'),
      store.getState().loadFeed('following'),
    ]);

    expect(store.getState().feeds.recommended).toMatchObject({
      loadState: 'error',
      errorMessage: '推荐流失败',
    });
    expect(store.getState().feeds.following).toMatchObject({
      ids: [followingPost.id],
      loadState: 'success',
      errorMessage: null,
    });
  });

  it('clears persisted demo changes and restores fixture viewer defaults', async () => {
    const fixturePost = post('post-music-speed-combo');
    const { repository } = createZeroLatencyRepository({
      'recommended:first': page([fixturePost]),
    });
    const memory = createMemoryStorage();
    const store = createSocialStore(repository, memory.storage);
    await store.getState().loadFeed('recommended');
    store.getState().toggleLike(fixturePost.id);
    store.getState().toggleBookmark(fixturePost.id);
    store.getState().toggleFollow('user-leo');

    await store.getState().resetDemoData();

    expect(store.getState().likedPostIds).toEqual([]);
    expect(store.getState().bookmarkedPostIds).toEqual([]);
    expect(store.getState().followedUserIds).toEqual(currentViewer.followedUserIds);
    expect(store.getState().feeds.recommended.ids).toEqual([]);
    expect(memory.values.has(STORAGE_KEY)).toBe(false);
  });
});
