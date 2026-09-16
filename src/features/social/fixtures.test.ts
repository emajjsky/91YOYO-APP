import './testAssetLoader';
import { describe, expect, it } from 'vitest';
import { POST_CATEGORIES, STYLE_TAGS } from '../../constants/categories';
import { currentViewer } from './mockProfiles';
import { mockPosts } from './mockPosts';
import { mockUsers } from './mockUsers';

describe('social fixtures', () => {
  it('provides enough uniquely identified users and posts', () => {
    expect(mockUsers.length).toBeGreaterThanOrEqual(12);
    expect(mockPosts.length).toBeGreaterThanOrEqual(40);
    expect(new Set(mockUsers.map((user) => user.id)).size).toBe(mockUsers.length);
    expect(new Set(mockPosts.map((post) => post.id)).size).toBe(mockPosts.length);
  });

  it('links every post to a fixture user', () => {
    expect(mockPosts.every((post) => mockUsers.some((user) => user.id === post.authorId))).toBe(true);
    expect(mockUsers.some((user) => user.id === currentViewer.userId)).toBe(true);
  });

  it('covers every category and style', () => {
    expect(new Set(mockPosts.map((post) => post.category))).toEqual(
      new Set(POST_CATEGORIES.map((item) => item.id)),
    );
    expect(new Set(mockPosts.flatMap((post) => post.styleTags))).toEqual(new Set(STYLE_TAGS));
  });

  it('covers all media variants with enough video and audio records', () => {
    expect(new Set(mockPosts.map((post) => post.media.type))).toEqual(
      new Set(['none', 'images', 'video', 'audio']),
    );
    expect(mockPosts.filter((post) => post.media.type === 'video').length).toBeGreaterThanOrEqual(8);
    expect(mockPosts.filter((post) => post.media.type === 'audio').length).toBeGreaterThanOrEqual(6);
  });

  it('uses local asset module references for every media URI', () => {
    expect(mockUsers.every((user) => typeof user.avatarUri === 'number')).toBe(true);

    for (const post of mockPosts) {
      if (post.media.type === 'images') {
        expect(post.media.assets.every((asset) => typeof asset.uri === 'number')).toBe(true);
      }
      if (post.media.type === 'video') {
        expect(typeof post.media.asset.uri).toBe('number');
        expect(typeof post.media.asset.posterUri).toBe('number');
      }
      if (post.media.type === 'audio') {
        expect(typeof post.media.asset.uri).toBe('number');
        expect(typeof post.media.asset.coverUri).toBe('number');
      }
    }
  });

  it('supports followed and discovery authors across cities', () => {
    const authorIds = new Set(mockPosts.map((post) => post.authorId));

    expect(currentViewer.followedUserIds.some((userId) => authorIds.has(userId))).toBe(true);
    expect([...authorIds].some((userId) => !currentViewer.followedUserIds.includes(userId))).toBe(true);
    expect(new Set(mockUsers.map((user) => user.city)).size).toBeGreaterThanOrEqual(4);
  });

  it('contains fixed old and new timestamps plus low and high engagement', () => {
    const timestamps = mockPosts.map((post) => Date.parse(post.createdAt));
    const engagement = mockPosts.map(
      (post) => post.likeCount + post.commentCount + post.shareCount + post.viewCount,
    );

    expect(Math.max(...timestamps)).toBe(Date.parse('2026-09-15T12:00:00.000Z'));
    expect(Math.max(...timestamps) - Math.min(...timestamps)).toBeGreaterThanOrEqual(30 * 24 * 60 * 60 * 1000);
    expect(Math.min(...engagement)).toBeLessThanOrEqual(20);
    expect(Math.max(...engagement)).toBeGreaterThanOrEqual(10_000);
  });
});
