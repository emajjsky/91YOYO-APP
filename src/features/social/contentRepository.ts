import {
  rankRecommendedPosts,
  selectFollowingPosts,
  type RankedPost,
} from './feedRanking';
import { currentViewer } from './mockProfiles';
import { mockPosts } from './mockPosts';
import { mockUsers } from './mockUsers';
import type { MediaContent, SocialPost } from './types';

const DEFAULT_LATENCY_MS = 180;
const DEFAULT_PAGE_LIMIT = 10;
const FIXTURE_RANKING_NOW = '2026-09-15T12:00:00.000Z';
const CURSOR_PATTERN = /^mock:(0|[1-9]\d*)$/;

const INVALID_CURSOR_ERROR = '内容游标无效';
const INVALID_LIMIT_ERROR = '内容分页数量无效';
const REQUEST_FAILURE_ERROR = '模拟内容请求失败';

function cloneMedia(media: MediaContent): MediaContent {
  switch (media.type) {
    case 'none':
      return { type: 'none' };
    case 'images':
      return {
        type: 'images',
        assets: media.assets.map((asset) => ({ ...asset })),
      };
    case 'video':
      return {
        type: 'video',
        asset: { ...media.asset },
      };
    case 'audio':
      return {
        type: 'audio',
        asset: { ...media.asset },
      };
  }
}

function clonePost(post: SocialPost): SocialPost {
  return {
    ...post,
    styleTags: [...post.styleTags],
    hashtags: [...post.hashtags],
    media: cloneMedia(post.media),
  };
}

function cloneRankedPost(rankedPost: RankedPost): RankedPost {
  return {
    ...rankedPost,
    post: clonePost(rankedPost.post),
  };
}

export type FeedMode = 'recommended' | 'following';

export interface ContentPage {
  items: RankedPost[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ContentRepository {
  getFeed(input: {
    mode: FeedMode;
    cursor?: string | null;
    limit?: number;
  }): Promise<ContentPage>;
  getPost(postId: string): Promise<SocialPost | null>;
}

export function createMockContentRepository(options?: {
  latencyMs?: number;
  failNextRequest?: boolean;
}): ContentRepository {
  const latencyMs = options?.latencyMs ?? DEFAULT_LATENCY_MS;
  let shouldFailNextRequest = options?.failNextRequest ?? false;

  const waitForRequest = async (): Promise<void> => {
    const shouldFail = shouldFailNextRequest;
    shouldFailNextRequest = false;

    await new Promise<void>((resolve) => {
      setTimeout(resolve, latencyMs);
    });

    if (shouldFail) {
      throw new Error(REQUEST_FAILURE_ERROR);
    }
  };

  const getRankedPosts = (mode: FeedMode): RankedPost[] => {
    if (mode === 'recommended') {
      return rankRecommendedPosts({
        posts: mockPosts,
        users: mockUsers,
        viewer: currentViewer,
        now: FIXTURE_RANKING_NOW,
      });
    }

    if (mode === 'following') {
      return selectFollowingPosts(mockPosts, currentViewer).map((post) => ({
        post,
        score: 0,
        reason: null,
      }));
    }

    throw new Error('内容流模式无效');
  };

  return {
    async getFeed({ mode, cursor, limit = DEFAULT_PAGE_LIMIT }): Promise<ContentPage> {
      await waitForRequest();

      if (!Number.isSafeInteger(limit) || limit <= 0) {
        throw new Error(INVALID_LIMIT_ERROR);
      }

      const rankedPosts = getRankedPosts(mode);
      let offset = 0;

      if (cursor !== undefined && cursor !== null) {
        const match = CURSOR_PATTERN.exec(cursor);
        const parsedOffset = match ? Number(match[1]) : Number.NaN;

        if (!Number.isSafeInteger(parsedOffset) || parsedOffset > rankedPosts.length) {
          throw new Error(INVALID_CURSOR_ERROR);
        }

        offset = parsedOffset;
      }

      const endOffset = Math.min(offset + limit, rankedPosts.length);
      const hasMore = endOffset < rankedPosts.length;

      return {
        items: rankedPosts.slice(offset, endOffset).map(cloneRankedPost),
        nextCursor: hasMore ? `mock:${endOffset}` : null,
        hasMore,
      };
    },

    async getPost(postId: string): Promise<SocialPost | null> {
      await waitForRequest();
      const post = mockPosts.find((candidate) => candidate.id === postId);
      return post ? clonePost(post) : null;
    },
  };
}
