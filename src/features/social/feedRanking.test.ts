import { describe, expect, it } from 'vitest';
import type { SocialPost, SocialUser, ViewerProfile } from './types';
import { rankRecommendedPosts, selectFollowingPosts } from './feedRanking';

const NOW = '2026-09-15T12:00:00.000Z';

const users: SocialUser[] = [
  {
    id: 'viewer',
    handle: 'viewer',
    displayName: '当前用户',
    avatarUri: 'viewer.png',
    bio: '',
    city: '上海',
    styleTags: ['1A'],
  },
  {
    id: 'followed',
    handle: 'followed',
    displayName: '已关注作者',
    avatarUri: 'followed.png',
    bio: '',
    city: '北京',
    styleTags: ['5A'],
  },
  {
    id: 'discovery',
    handle: 'discovery',
    displayName: '发现作者',
    avatarUri: 'discovery.png',
    bio: '',
    city: '成都',
    styleTags: ['1A'],
  },
];

const viewer: ViewerProfile = {
  userId: 'viewer',
  interestStyles: ['1A'],
  interestCategories: ['tutorial'],
  followedUserIds: ['followed'],
};

function post(overrides: Partial<SocialPost> & Pick<SocialPost, 'id'>): SocialPost {
  return {
    authorId: 'discovery',
    content: overrides.id,
    category: 'daily',
    styleTags: ['2A'],
    hashtags: [],
    createdAt: NOW,
    media: { type: 'none' },
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    viewCount: 0,
    visibility: 'public',
    ...overrides,
  };
}

describe('rankRecommendedPosts', () => {
  it('ranks an interest match above an unrelated post with equal engagement', () => {
    const ranked = rankRecommendedPosts({
      posts: [
        post({ id: 'unrelated' }),
        post({ id: 'matched', category: 'tutorial', styleTags: ['1A'] }),
      ],
      users,
      viewer,
      now: NOW,
    });

    expect(ranked.map(({ post: rankedPost }) => rankedPost.id)).toEqual(['matched', 'unrelated']);
    expect(ranked.map(({ score }) => score)).toEqual([0.65, 0.25]);
  });

  it('adds relationship weight for a followed author', () => {
    const ranked = rankRecommendedPosts({
      posts: [post({ id: 'discovery-post' }), post({ id: 'followed-post', authorId: 'followed' })],
      users,
      viewer,
      now: NOW,
    });

    expect(ranked.map(({ post: rankedPost }) => rankedPost.id)).toEqual([
      'followed-post',
      'discovery-post',
    ]);
    expect(ranked[0]).toMatchObject({ score: 0.4, reason: null });
    expect(ranked[1].score).toBe(0.25);
  });

  it('uses freshness and engagement without allowing either to exceed one', () => {
    const [ranked] = rankRecommendedPosts({
      posts: [
        post({
          id: 'maximum-signals',
          authorId: 'followed',
          category: 'tutorial',
          styleTags: ['1A'],
          createdAt: '2026-09-16T12:00:00.000Z',
          likeCount: Number.MAX_VALUE,
          commentCount: Number.MAX_VALUE,
          shareCount: Number.MAX_VALUE,
          viewCount: Number.MAX_VALUE,
        }),
      ],
      users,
      viewer,
      now: NOW,
    });

    expect(ranked.score).toBe(1);
  });

  it('uses createdAt descending as the deterministic tie breaker', () => {
    const ranked = rankRecommendedPosts({
      posts: [
        post({ id: 'older', createdAt: '2026-09-13T12:00:00.000Z' }),
        post({ id: 'newer', createdAt: '2026-09-14T12:00:00.000Z' }),
      ],
      users,
      viewer,
      now: '2026-09-22T12:00:00.000Z',
    });

    expect(ranked.map(({ post: rankedPost }) => rankedPost.id)).toEqual(['newer', 'older']);
  });

  it('returns a human-readable reason for non-followed recommendations', () => {
    const [ranked] = rankRecommendedPosts({
      posts: [post({ id: 'style-match', styleTags: ['1A'] })],
      users,
      viewer,
      now: NOW,
    });

    expect(ranked.reason).toBe('因为你喜欢 1A');
  });

  it("filters out the current user's non-public posts", () => {
    const ranked = rankRecommendedPosts({
      posts: [
        post({ id: 'private-own-post', authorId: 'viewer', visibility: 'followers' }),
        post({ id: 'public-own-post', authorId: 'viewer' }),
      ],
      users,
      viewer,
      now: NOW,
    });

    expect(ranked.map(({ post: rankedPost }) => rankedPost.id)).toEqual(['public-own-post']);
  });

  it('keeps malformed timestamps finite and deterministically ordered', () => {
    const posts = [
      post({ id: 'invalid-b', createdAt: 'not-a-date' }),
      post({ id: 'valid', createdAt: '2026-09-14T12:00:00.000Z' }),
      post({ id: 'invalid-a', createdAt: '' }),
      post({ id: 'invalid-calendar', createdAt: '2026-09-31T12:00:00.000Z' }),
    ];

    const first = rankRecommendedPosts({ posts, users, viewer, now: 'invalid-now' });
    const second = rankRecommendedPosts({ posts: [...posts].reverse(), users, viewer, now: 'invalid-now' });

    expect(first.every(({ score }) => Number.isFinite(score))).toBe(true);
    expect(first.map(({ post: rankedPost }) => rankedPost.id)).toEqual([
      'valid',
      'invalid-a',
      'invalid-b',
      'invalid-calendar',
    ]);
    expect(second.map(({ post: rankedPost }) => rankedPost.id)).toEqual(
      first.map(({ post: rankedPost }) => rankedPost.id),
    );
  });
});

describe('selectFollowingPosts', () => {
  it('returns all posts from followed authors in newest-first order', () => {
    const selected = selectFollowingPosts(
      [
        post({ id: 'followed-older', authorId: 'followed', createdAt: '2026-09-13T12:00:00.000Z' }),
        post({ id: 'not-followed', createdAt: '2026-09-15T12:00:00.000Z' }),
        post({ id: 'followed-newer', authorId: 'followed', createdAt: '2026-09-14T12:00:00.000Z' }),
        post({ id: 'followed-private', authorId: 'followed', visibility: 'followers' }),
      ],
      viewer,
    );

    expect(selected.map((selectedPost) => selectedPost.id)).toEqual([
      'followed-private',
      'followed-newer',
      'followed-older',
    ]);
  });
});
