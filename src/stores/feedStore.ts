import { Image } from 'react-native';
import { create } from 'zustand';
import {
  useSocialStore,
  type FeedLoadState,
  type SocialState,
} from '../features/social/socialStore';
import type { MediaContent, SocialPost, SocialUser } from '../features/social/types';
import type { FeedMode } from '../features/social/contentRepository';
import type { FeedScope, IFeedItem } from '../types/feed';

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

function modeForScope(scope: FeedScope): FeedMode {
  return scope === 'following' ? 'following' : 'recommended';
}

function assetUri(source: number | string): string {
  if (typeof source === 'string') return source;
  return Image.resolveAssetSource(source)?.uri ?? '';
}

function durationText(durationSeconds: number): string {
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = Math.max(0, Math.floor(durationSeconds % 60));
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function mediaFields(media: MediaContent): Pick<IFeedItem, 'video' | 'images' | 'audio'> {
  switch (media.type) {
    case 'none':
      return {};
    case 'images':
      return {
        images: media.assets.map((asset) => ({
          url: assetUri(asset.uri),
          name: asset.alt,
        })),
      };
    case 'video':
      return {
        video: {
          id: media.asset.id,
          url: media.asset.playbackStatus === 'ready' ? assetUri(media.asset.uri) : '',
          title: media.asset.title,
          posterUrl: assetUri(media.asset.posterUri),
        },
      };
    case 'audio':
      return {
        audio: {
          id: media.asset.id,
          title: media.asset.title,
          bpm: media.asset.bpm,
          durationText: durationText(media.asset.durationSeconds),
          src: assetUri(media.asset.uri),
          coverImgUrl: assetUri(media.asset.coverUri),
        },
      };
  }
}

function toLegacyFeedItem(
  post: SocialPost,
  author: SocialUser | undefined,
  state: SocialState,
): IFeedItem {
  return {
    id: post.id,
    author: {
      uid: author?.id ?? post.authorId,
      nickname: author?.displayName ?? author?.handle ?? post.authorId,
      avatarUrl: author ? assetUri(author.avatarUri) : '',
      styleTags: author?.styleTags ?? [],
      levelTag: author?.roleLabel,
    },
    content: post.content,
    tags: post.hashtags,
    category: post.category,
    createdAt: post.createdAt,
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    shareCount: post.shareCount,
    isLiked: state.likedPostIds.includes(post.id),
    isBookmarked: state.bookmarkedPostIds.includes(post.id),
    ...mediaFields(post.media),
  };
}

function projectFeed(state: SocialState, scope: FeedScope) {
  const feed = state.feeds[modeForScope(scope)];
  return {
    feedList: feed.ids.flatMap((postId) => {
      const post = state.postsById[postId];
      return post ? [toLegacyFeedItem(post, state.usersById[post.authorId], state)] : [];
    }),
    loadState: feed.loadState,
    errorMessage: feed.errorMessage,
    nextCursor: feed.nextCursor,
    hasMore: feed.hasMore,
  };
}

const initialScope: FeedScope = 'public';

// Temporary adapter for Home/PostDetail until Task 7 moves them to useSocialStore.
export const useFeedStore = create<FeedState>((set, get) => ({
  ...projectFeed(useSocialStore.getState(), initialScope),
  activeScope: initialScope,

  loadFeed: async (scope, refresh = false) => {
    set({ activeScope: scope, ...projectFeed(useSocialStore.getState(), scope) });
    await useSocialStore.getState().loadFeed(modeForScope(scope), refresh);
  },

  loadMore: async () => {
    await useSocialStore.getState().loadMore(modeForScope(get().activeScope));
  },

  toggleLike: (postId) => {
    useSocialStore.getState().toggleLike(postId);
  },

  toggleBookmark: (postId) => {
    useSocialStore.getState().toggleBookmark(postId);
  },
}));

useSocialStore.subscribe((state) => {
  const activeScope = useFeedStore.getState().activeScope;
  useFeedStore.setState(projectFeed(state, activeScope));
});
