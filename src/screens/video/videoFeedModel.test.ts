import { describe, expect, it } from 'vitest';
import type { SocialPost } from '../../features/social/types';
import { orderVideoPosts } from './videoFeedModel';

function post(overrides: Partial<SocialPost> & Pick<SocialPost, 'id'>): SocialPost {
  return {
    authorId: 'author',
    content: overrides.id,
    category: 'daily',
    styleTags: ['1A'],
    hashtags: [],
    createdAt: '2026-09-15T12:00:00.000Z',
    media: {
      type: 'video',
      asset: {
        id: `asset-${overrides.id}`,
        title: overrides.id,
        posterUri: 'poster.jpg',
        aspectRatio: 1,
        playbackStatus: 'reserved',
        durationSeconds: null,
      },
    },
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    viewCount: 0,
    visibility: 'public',
    ...overrides,
  };
}

describe('orderVideoPosts', () => {
  it('places the requested video first without mutating input', () => {
    const posts = [post({ id: 'older' }), post({ id: 'current' })];
    const originalOrder = posts.map(({ id }) => id);

    expect(orderVideoPosts(posts, 'current').map(({ id }) => id)).toEqual(['current', 'older']);
    expect(posts.map(({ id }) => id)).toEqual(originalOrder);
  });

  it('filters non-video and non-public records', () => {
    const posts = [
      post({ id: 'video' }),
      post({ id: 'text', media: { type: 'none' } }),
      post({ id: 'followers-only', visibility: 'followers' }),
    ];

    expect(orderVideoPosts(posts, 'video').map(({ id }) => id)).toEqual(['video']);
  });

  it('keeps an explicitly opened followers-only video as the first item', () => {
    const posts = [
      post({ id: 'public' }),
      post({ id: 'opened', visibility: 'followers' }),
      post({ id: 'hidden-related', visibility: 'followers' }),
    ];

    expect(orderVideoPosts(posts, 'opened').map(({ id }) => id)).toEqual(['opened', 'public']);
  });

  it('puts same-category and shared-style videos before unrelated videos', () => {
    const posts = [
      post({ id: 'unrelated', category: 'music', styleTags: ['5A'] }),
      post({ id: 'same-style', category: 'daily', styleTags: ['1A', '5A'] }),
      post({ id: 'same-category', category: 'tutorial', styleTags: ['2A'] }),
      post({ id: 'current', category: 'tutorial', styleTags: ['1A'] }),
    ];

    expect(orderVideoPosts(posts, 'current').map(({ id }) => id)).toEqual([
      'current',
      'same-category',
      'same-style',
      'unrelated',
    ]);
  });

  it('uses newest-first and ID fallback for equal relevance', () => {
    const posts = [
      post({ id: 'b', createdAt: '2026-09-14T12:00:00.000Z' }),
      post({ id: 'a', createdAt: '2026-09-14T12:00:00.000Z' }),
      post({ id: 'newest', createdAt: '2026-09-15T12:00:00.000Z' }),
    ];

    expect(orderVideoPosts(posts, 'missing').map(({ id }) => id)).toEqual(['newest', 'a', 'b']);
  });

  it('falls back to the available videos when the initial ID is missing', () => {
    expect(orderVideoPosts([post({ id: 'video' })], 'missing').map(({ id }) => id)).toEqual(['video']);
  });
});
