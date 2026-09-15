import { describe, expect, it, vi } from 'vitest';
import { createFeedRepository } from './feedRepository';

describe('feedRepository', () => {
  it('loads a public feed page from the shared API', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      data: [{
        id: 'post-1',
        author: { uid: 'user-1', nickname: '球友', avatarUrl: '', styleTags: ['1A'] },
        content: '服务器 Feed',
        tags: ['#1A'],
        category: 'tutorial',
        createdAt: '2026-09-15T08:00:00.000Z',
        likeCount: 1,
        commentCount: 0,
        shareCount: 0,
        isLiked: false,
        isBookmarked: false,
      }],
      page: { nextCursor: 'next-1', hasMore: true },
    }), { status: 200, headers: { 'content-type': 'application/json' } }));
    const repository = createFeedRepository(fetchImpl, { baseUrl: 'https://api.91yoyo.test', timeoutMs: 1000 });

    const page = await repository.fetchFeed({ scope: 'public', limit: 10 });

    expect(page.items[0]?.content).toBe('服务器 Feed');
    expect(page.nextCursor).toBe('next-1');
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.91yoyo.test/v1/feed?limit=10',
      expect.objectContaining({ method: 'GET' }),
    );
  });
});
