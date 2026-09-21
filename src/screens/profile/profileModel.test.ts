import { describe, expect, it } from 'vitest';
import type { SocialPost } from '../../features/social/types';
import { postsForUser } from './profileModel';

function post(id: string, authorId: string, createdAt: string): SocialPost {
  return {
    id,
    authorId,
    content: id,
    category: 'daily',
    styleTags: ['1A'],
    hashtags: [],
    createdAt,
    media: { type: 'none' },
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    viewCount: 0,
    visibility: 'public',
  };
}

describe('profile model', () => {
  it('returns only the selected users posts in newest-first order', () => {
    const posts = [
      post('older', 'user-a', '2026-09-01T00:00:00.000Z'),
      post('other', 'user-b', '2026-09-03T00:00:00.000Z'),
      post('newer', 'user-a', '2026-09-02T00:00:00.000Z'),
    ];

    expect(postsForUser(posts, 'user-a').map(({ id }) => id)).toEqual(['newer', 'older']);
  });
});
