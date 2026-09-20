import { describe, expect, it } from 'vitest';
import type { SocialPost, SocialUser } from '../../features/social/types';
import { getTrendingTopics, rankExplorePosts } from './exploreSearch';

const NOW = '2026-09-15T12:00:00.000Z';

const users: SocialUser[] = [
  {
    id: 'author-lin',
    handle: 'linloops',
    displayName: '阿林',
    avatarUri: 'lin.png',
    bio: '',
    city: '上海',
    styleTags: ['1A'],
  },
  {
    id: 'author-mori',
    handle: 'mori2a',
    displayName: '森森',
    avatarUri: 'mori.png',
    bio: '',
    city: '杭州',
    styleTags: ['2A'],
  },
];

function post(overrides: Partial<SocialPost> & Pick<SocialPost, 'id'>): SocialPost {
  return {
    authorId: 'author-lin',
    content: overrides.id,
    category: 'daily',
    styleTags: ['1A'],
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

describe('rankExplorePosts', () => {
  it.each([
    ['阿林', 'by-name'],
    ['LINLOOPS', 'by-handle'],
    ['换向', 'by-body'],
    ['#基础教学', 'by-hashtag'],
  ])('searches authors, handles, body, and hashtags with %s', (query, expectedId) => {
    const posts = [
      post({ id: 'by-name', content: '普通记录', authorId: 'author-lin' }),
      post({ id: 'by-handle', content: '普通记录', authorId: 'author-lin', createdAt: '2026-09-15T11:00:00.000Z' }),
      post({ id: 'by-body', content: '今天练习换向', authorId: 'author-mori', createdAt: '2026-09-15T10:00:00.000Z' }),
      post({ id: 'by-hashtag', hashtags: ['#基础教学'], authorId: 'author-mori', createdAt: '2026-09-15T09:00:00.000Z' }),
    ];

    expect(rankExplorePosts({ posts, users, category: 'all', query, now: NOW })
      .map(({ post: resultPost }) => resultPost.id)).toContain(expectedId);
  });

  it('filters by category only while search is blank', () => {
    const posts = [
      post({ id: 'daily', category: 'daily' }),
      post({ id: 'tutorial', category: 'tutorial', content: '跨分类关键词' }),
    ];

    expect(rankExplorePosts({ posts, users, category: 'daily', query: '', now: NOW })
      .map(({ post: resultPost }) => resultPost.id)).toEqual(['daily']);
    expect(rankExplorePosts({ posts, users, category: 'daily', query: '跨分类', now: NOW })
      .map(({ post: resultPost }) => resultPost.id)).toEqual(['tutorial']);
  });

  it('orders by engagement and freshness without a relationship signal', () => {
    const posts = [
      post({ id: 'low', createdAt: '2026-09-08T12:00:00.000Z' }),
      post({ id: 'popular', likeCount: 8_000, viewCount: 90_000 }),
      post({ id: 'fresh', createdAt: '2026-09-15T11:59:00.000Z' }),
    ];

    expect(rankExplorePosts({ posts, users, category: 'all', query: '', now: NOW })
      .map(({ post: resultPost }) => resultPost.id)).toEqual(['popular', 'fresh', 'low']);
  });

  it('uses creation time and ID as deterministic tie breakers', () => {
    const posts = [
      post({ id: 'b', createdAt: '2026-09-14T12:00:00.000Z' }),
      post({ id: 'a', createdAt: '2026-09-14T12:00:00.000Z' }),
      post({ id: 'newest', createdAt: '2026-09-15T12:00:00.000Z' }),
    ];

    expect(rankExplorePosts({ posts, users, category: 'all', query: '', now: NOW })
      .map(({ post: resultPost }) => resultPost.id)).toEqual(['newest', 'a', 'b']);
  });
});

describe('getTrendingTopics', () => {
  it('counts category topics and sorts equal counts by label', () => {
    const posts = [
      post({ id: 'one', category: 'tutorial', hashtags: ['#1A', '#基础'] }),
      post({ id: 'two', category: 'tutorial', hashtags: ['#1A', '#动作'] }),
      post({ id: 'three', category: 'daily', hashtags: ['#日常'] }),
    ];

    expect(getTrendingTopics(posts, 'tutorial', 3)).toEqual([
      { label: '#1A', count: 2 },
      { label: '#动作', count: 1 },
      { label: '#基础', count: 1 },
    ]);
  });
});
