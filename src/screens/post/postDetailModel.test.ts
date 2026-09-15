import { describe, expect, it } from 'vitest';
import { findPostById } from './postDetailModel';
import type { IFeedItem } from '../../types/feed';

const posts = [
  { id: 'post-1', content: '第一条动态' },
  { id: 'post-2', content: '第二条动态' },
] as IFeedItem[];

describe('findPostById', () => {
  it('returns the feed item that matches the route id', () => {
    expect(findPostById(posts, 'post-2')).toBe(posts[1]);
  });

  it('returns undefined for a post that is not loaded', () => {
    expect(findPostById(posts, 'missing')).toBeUndefined();
  });
});
