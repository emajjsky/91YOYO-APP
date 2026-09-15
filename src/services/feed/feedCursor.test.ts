import { describe, expect, it } from 'vitest';
import { decodeFeedCursor, encodeFeedCursor } from './feedCursor';

describe('feed cursor', () => {
  it('round trips a timestamp and UUID without losing data', () => {
    const cursor = {
      publishedAt: '2026-09-15T08:00:00.000Z',
      id: '018f1d91-7b7c-7aa0-8000-0123456789ab',
    };
    expect(decodeFeedCursor(encodeFeedCursor(cursor))).toEqual(cursor);
  });

  it('rejects malformed or untrusted cursor values', () => {
    expect(() => decodeFeedCursor('not-json')).toThrow('分页游标无效，请刷新后重试');
    expect(() => decodeFeedCursor(encodeURIComponent(JSON.stringify({
      publishedAt: 'not-a-date',
      id: 'id.lt.injected',
    })))).toThrow('分页游标无效，请刷新后重试');
  });
});
