import './testAssetLoader';
import { describe, expect, it } from 'vitest';
import { POST_CATEGORIES, STYLE_TAGS } from '../../constants/categories';
import { currentViewer } from './mockProfiles';
import { mockPosts } from './mockPosts';
import { mockUsers } from './mockUsers';
import type { MediaContent } from './types';

type VideoAsset = Extract<MediaContent, { type: 'video' }>['asset'];
type ReservedVideoAsset = Extract<VideoAsset, { playbackStatus: 'reserved' }>;
type ReadyVideoAsset = Extract<VideoAsset, { playbackStatus: 'ready' }>;
type IsNever<T> = [T] extends [never] ? true : false;
type ReservedVideoRejectsUri = ReservedVideoAsset extends { uri?: never } ? true : false;
type ReadyVideoRequiresUri = ReadyVideoAsset extends { uri: number | string } ? true : false;

const readyVariantExists: IsNever<ReadyVideoAsset> = false;
const reservedVideoRejectsUri: ReservedVideoRejectsUri = true;
const readyVideoRequiresUri: ReadyVideoRequiresUri = true;

describe('social fixtures', () => {
  it('provides enough uniquely identified users and posts', () => {
    expect(mockUsers.length).toBeGreaterThanOrEqual(12);
    expect(mockPosts.length).toBeGreaterThanOrEqual(40);
    expect(new Set(mockUsers.map((user) => user.id)).size).toBe(mockUsers.length);
    expect(new Set(mockPosts.map((post) => post.id)).size).toBe(mockPosts.length);
  });

  it('keeps post IDs attached to content instead of array positions', () => {
    expect(mockPosts.find((post) => post.content.startsWith('本届决赛'))?.id).toBe(
      'post-contest-final-runthrough',
    );
    expect(mockPosts.find((post) => post.content.startsWith('双手组报名'))?.id).toBe(
      'post-event-2a-registration',
    );
  });

  it('links every post to a fixture user', () => {
    expect(mockPosts.every((post) => mockUsers.some((user) => user.id === post.authorId))).toBe(true);
    expect(mockUsers.some((user) => user.id === currentViewer.userId)).toBe(true);
    expect(
      currentViewer.followedUserIds.every((userId) => mockUsers.some((user) => user.id === userId)),
    ).toBe(true);
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

  it('uses local asset module references for playable media and posters', () => {
    expect(mockUsers.every((user) => typeof user.avatarUri === 'number')).toBe(true);

    for (const post of mockPosts) {
      if (post.media.type === 'images') {
        expect(post.media.assets.every((asset) => typeof asset.uri === 'number')).toBe(true);
      }
      if (post.media.type === 'video') {
        expect(typeof post.media.asset.posterUri).toBe('number');
        if (post.media.asset.playbackStatus === 'ready') {
          expect(typeof post.media.asset.uri).toBe('number');
        }
      }
      if (post.media.type === 'audio') {
        expect(typeof post.media.asset.uri).toBe('number');
        expect(typeof post.media.asset.coverUri).toBe('number');
      }
    }
  });

  it('marks reserved videos as unavailable and requires a URI for ready videos', () => {
    const videoAssets = mockPosts.flatMap((post) =>
      post.media.type === 'video' ? [post.media.asset] : [],
    );

    expect(readyVariantExists).toBe(false);
    expect(reservedVideoRejectsUri).toBe(true);
    expect(readyVideoRequiresUri).toBe(true);
    expect(videoAssets).toHaveLength(8);
    expect(videoAssets.every((asset) => asset.playbackStatus === 'reserved')).toBe(true);
    expect(videoAssets.every((asset) => !('uri' in asset))).toBe(true);
  });

  it('uses globally unique IDs for every media asset', () => {
    const assetIds = mockPosts.flatMap((post) => {
      if (post.media.type === 'images') return post.media.assets.map((asset) => asset.id);
      if (post.media.type === 'video' || post.media.type === 'audio') return [post.media.asset.id];
      return [];
    });

    expect(new Set(assetIds).size).toBe(assetIds.length);
  });

  it('supports followed and discovery authors across cities', () => {
    const authorIds = new Set(mockPosts.map((post) => post.authorId));

    expect(currentViewer.followedUserIds.some((userId) => authorIds.has(userId))).toBe(true);
    expect([...authorIds].some((userId) => !currentViewer.followedUserIds.includes(userId))).toBe(true);
    expect(new Set(mockUsers.map((user) => user.city)).size).toBeGreaterThanOrEqual(4);
  });

  it('does not invent public identity labels for fixture users', () => {
    expect(mockUsers.every((user) => !('roleLabel' in user))).toBe(true);
  });

  it('includes four, six, and nine image albums for grid coverage', () => {
    const albumSizes = mockPosts.flatMap((post) =>
      post.media.type === 'images' ? [post.media.assets.length] : [],
    );

    expect(albumSizes).toEqual(expect.arrayContaining([4, 6, 9]));
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
