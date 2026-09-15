import { describe, expect, it } from 'vitest';
import { buildApp } from './app.js';

describe('91YOYO API', () => {
  it('reports database and COS readiness', async () => {
    const app = buildApp({
      health: {
        checkDatabase: async () => true,
        checkCos: async () => true,
      },
      feed: { listPublic: async () => ({ items: [], nextCursor: null, hasMore: false }) },
    });

    const response = await app.inject({ method: 'GET', url: '/health/ready' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ready', database: true, cos: true });
    await app.close();
  });

  it('returns a cursor-paginated public feed', async () => {
    const app = buildApp({
      health: {
        checkDatabase: async () => true,
        checkCos: async () => true,
      },
      feed: {
        listPublic: async ({ limit }) => ({
          items: [{ id: 'post-1', content: '真实数据库 Feed' }],
          nextCursor: 'cursor-1',
          hasMore: true,
          receivedLimit: limit,
        }),
      },
    });

    const response = await app.inject({ method: 'GET', url: '/v1/feed?limit=10' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      data: [{ id: 'post-1', content: '真实数据库 Feed' }],
      page: { nextCursor: 'cursor-1', hasMore: true },
    });
    await app.close();
  });
});
