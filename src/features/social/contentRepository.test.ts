import { createRequire } from 'node:module';

import { beforeAll, describe, expect, it } from 'vitest';

import { currentViewer } from './mockProfiles';
import type { ContentRepository } from './contentRepository';

const runtimeRequire = createRequire(import.meta.url);
const loadAsset = (module: NodeModule) => {
  module.exports = 1;
};

runtimeRequire.extensions['.jpg'] = loadAsset;
runtimeRequire.extensions['.wav'] = loadAsset;

let createMockContentRepository: typeof import('./contentRepository').createMockContentRepository;

beforeAll(async () => {
  ({ createMockContentRepository } = await import('./contentRepository'));
});

const createRepository = (failNextRequest = false): ContentRepository =>
  createMockContentRepository({ latencyMs: 0, failNextRequest });

describe('createMockContentRepository', () => {
  it('returns the default first page with a stable offset cursor', async () => {
    const page = await createRepository().getFeed({ mode: 'recommended' });

    expect(page.items).toHaveLength(10);
    expect(page.nextCursor).toBe('mock:10');
    expect(page.hasMore).toBe(true);
  });

  it('continues from the cursor without returning duplicate posts', async () => {
    const repository = createRepository();
    const firstPage = await repository.getFeed({ mode: 'recommended', limit: 4 });
    const secondPage = await repository.getFeed({
      mode: 'recommended',
      cursor: firstPage.nextCursor,
      limit: 4,
    });
    const firstIds = firstPage.items.map(({ post }) => post.id);
    const secondIds = secondPage.items.map(({ post }) => post.id);

    expect(firstPage.nextCursor).toBe('mock:4');
    expect(secondPage.nextCursor).toBe('mock:8');
    expect(secondIds).toHaveLength(4);
    expect(secondIds.some((id) => firstIds.includes(id))).toBe(false);
  });

  it('keeps the recommendation order fixed to the fixture ranking time', async () => {
    const expectedFirstFive = [
      'post-contest-final-runthrough',
      'post-tutorial-5a-direction-change',
      'post-editorial-2a-contest-loop',
      'post-tutorial-4a-catch-height',
      'post-music-clean-steps',
    ];

    const first = await createRepository().getFeed({ mode: 'recommended', limit: 5 });
    const second = await createRepository().getFeed({ mode: 'recommended', limit: 5 });

    expect(first.items.map(({ post }) => post.id)).toEqual(expectedFirstFive);
    expect(second.items.map(({ post }) => post.id)).toEqual(expectedFirstFive);
  });

  it('returns only followed authors in newest-first order', async () => {
    const page = await createRepository().getFeed({ mode: 'following', limit: 100 });
    const expectedIds = [
      'post-contest-final-runthrough',
      'post-tutorial-5a-direction-change',
      'post-editorial-2a-contest-loop',
      'post-tutorial-4a-catch-height',
      'post-music-clean-steps',
      'post-music-5a-rhythm',
      'post-music-2a-tempo',
      'post-tutorial-shoulder-tension',
      'post-contest-catch-preparation',
      'post-tutorial-string-mounts',
      'post-tutorial-2a-string-length',
      'post-meetup-4a-safety-zone',
      'post-product-5a-counterweight',
      'post-event-2a-registration',
    ];

    expect(page.items.map(({ post }) => post.id)).toEqual(expectedIds);
    expect(
      page.items.every(({ post }) => currentViewer.followedUserIds.includes(post.authorId)),
    ).toBe(true);
    expect(page).toMatchObject({ nextCursor: null, hasMore: false });
  });

  it('returns null for an unknown post', async () => {
    await expect(createRepository().getPost('post-does-not-exist')).resolves.toBeNull();
  });

  it('fails exactly one request before succeeding', async () => {
    const repository = createRepository(true);

    await expect(repository.getFeed({ mode: 'recommended', limit: 1 })).rejects.toThrow(
      new Error('模拟内容请求失败'),
    );
    await expect(repository.getFeed({ mode: 'recommended', limit: 1 })).resolves.toMatchObject({
      nextCursor: 'mock:1',
      hasMore: true,
    });
  });

  it.each([
    '',
    'mock:',
    'mock:-1',
    'mock:1.5',
    'mock:01',
    'mock:9007199254740992',
    'feed:1',
  ])('rejects malformed cursor %j', async (cursor) => {
    await expect(
      createRepository().getFeed({ mode: 'recommended', cursor }),
    ).rejects.toEqual(new Error('内容游标无效'));
  });

  it('rejects a cursor beyond the available feed instead of looping', async () => {
    await expect(
      createRepository().getFeed({ mode: 'recommended', cursor: 'mock:999' }),
    ).rejects.toEqual(new Error('内容游标无效'));
  });

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid page limit %s',
    async (limit) => {
      await expect(
        createRepository().getFeed({ mode: 'recommended', limit }),
      ).rejects.toEqual(new Error('内容分页数量无效'));
    },
  );

  it('returns the fixture object for a known post', async () => {
    await expect(
      createRepository().getPost('post-contest-final-runthrough'),
    ).resolves.toMatchObject({
      id: 'post-contest-final-runthrough',
      authorId: 'user-chen',
    });
  });
});
