import { createRequire } from 'node:module';

import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { currentViewer } from './mockProfiles';
import type { ContentRepository } from './contentRepository';

const runtimeRequire = createRequire(import.meta.url);
const previousJpgHandler = runtimeRequire.extensions['.jpg'];
const previousWavHandler = runtimeRequire.extensions['.wav'];
const loadAsset = (module: NodeModule) => {
  module.exports = 1;
};

runtimeRequire.extensions['.jpg'] = loadAsset;
runtimeRequire.extensions['.wav'] = loadAsset;

let createMockContentRepository: typeof import('./contentRepository').createMockContentRepository;

beforeAll(async () => {
  ({ createMockContentRepository } = await import('./contentRepository'));
});

afterEach(() => {
  vi.useRealTimers();
});

afterAll(() => {
  if (previousJpgHandler) {
    runtimeRequire.extensions['.jpg'] = previousJpgHandler;
  } else {
    delete runtimeRequire.extensions['.jpg'];
  }

  if (previousWavHandler) {
    runtimeRequire.extensions['.wav'] = previousWavHandler;
  } else {
    delete runtimeRequire.extensions['.wav'];
  }
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

  it('waits for the default 180ms latency before resolving', async () => {
    vi.useFakeTimers();
    const request = createMockContentRepository().getPost('post-does-not-exist');
    let settled = false;
    void request.then(() => {
      settled = true;
    });

    await vi.advanceTimersByTimeAsync(179);
    expect(settled).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    await expect(request).resolves.toBeNull();
    expect(settled).toBe(true);
  });

  it('shares one failure across getPost and getFeed before succeeding', async () => {
    const repository = createRepository(true);

    await expect(repository.getPost('post-contest-final-runthrough')).rejects.toThrow(
      new Error('模拟内容请求失败'),
    );
    await expect(repository.getFeed({ mode: 'recommended', limit: 1 })).resolves.toMatchObject({
      nextCursor: 'mock:1',
      hasMore: true,
    });
    await expect(repository.getPost('post-contest-final-runthrough')).resolves.toMatchObject({
      id: 'post-contest-final-runthrough',
    });
  });

  it('assigns a one-shot failure to only the first concurrently started request', async () => {
    const repository = createRepository(true);

    const firstRequest = repository.getPost('post-contest-final-runthrough');
    const secondRequest = repository.getFeed({ mode: 'recommended', limit: 1 });

    await expect(firstRequest).rejects.toEqual(new Error('模拟内容请求失败'));
    await expect(secondRequest).resolves.toMatchObject({
      items: [{ post: { id: 'post-contest-final-runthrough' } }],
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

  it('isolates recommended posts from top-level and nested consumer mutations', async () => {
    const repository = createRepository();
    const firstResult = await repository.getFeed({ mode: 'recommended', limit: 1 });
    const returnedPost = firstResult.items[0].post;

    returnedPost.content = '被调用方修改';
    returnedPost.styleTags.push('2A');
    returnedPost.hashtags.push('#被修改');
    if (returnedPost.media.type !== 'video') {
      throw new Error('测试数据应为视频帖子');
    }
    returnedPost.media.asset.title = '被修改的视频标题';

    const nextResult = await repository.getFeed({ mode: 'recommended', limit: 1 });
    const nextPost = nextResult.items[0].post;

    expect(nextPost.content).toBe(
      '本届决赛赛前的公开走台影像记录了选手如何在最后阶段确认落点。',
    );
    expect(nextPost.styleTags).toEqual(['1A']);
    expect(nextPost.hashtags).toEqual(['#1A', '#比赛日']);
    expect(nextPost.media).toMatchObject({
      type: 'video',
      asset: { title: '决赛走台记录' },
    });
  });

  it('isolates following audio and image media from consumer mutations', async () => {
    const repository = createRepository();
    const firstResult = await repository.getFeed({ mode: 'following', limit: 100 });
    const audioPost = firstResult.items.find(
      ({ post }) => post.id === 'post-music-clean-steps',
    )?.post;
    const imagePost = firstResult.items.find(
      ({ post }) => post.id === 'post-tutorial-shoulder-tension',
    )?.post;

    expect(audioPost?.media.type).toBe('audio');
    expect(imagePost?.media.type).toBe('images');
    if (audioPost?.media.type !== 'audio' || imagePost?.media.type !== 'images') {
      throw new Error('测试数据应包含音频和图片帖子');
    }

    audioPost.content = '被调用方修改';
    audioPost.media.asset.title = '被修改的音频标题';
    imagePost.media.assets[0].alt = '被修改的图片说明';
    imagePost.media.assets.length = 0;

    const nextResult = await repository.getFeed({ mode: 'following', limit: 100 });
    const nextAudioPost = nextResult.items.find(
      ({ post }) => post.id === 'post-music-clean-steps',
    )?.post;
    const nextImagePost = nextResult.items.find(
      ({ post }) => post.id === 'post-tutorial-shoulder-tension',
    )?.post;

    expect(nextAudioPost?.content).toBe(
      '92 BPM 适合把新连招拆成四拍一段，先保证每个停顿都清楚。',
    );
    expect(nextAudioPost?.media).toMatchObject({
      type: 'audio',
      asset: { title: 'Clean Steps' },
    });
    expect(nextImagePost?.media).toMatchObject({
      type: 'images',
      assets: [{ alt: '选手在比赛场地进行悠悠球动作' }],
    });
  });

  it('isolates direct post lookups from top-level and nested consumer mutations', async () => {
    const repository = createRepository();
    const returnedPost = await repository.getPost('post-history-indiana-contest');

    expect(returnedPost?.media.type).toBe('images');
    if (returnedPost?.media.type !== 'images') {
      throw new Error('测试数据应为图片帖子');
    }

    returnedPost.content = '被调用方修改';
    returnedPost.styleTags.push('5A');
    returnedPost.hashtags.length = 0;
    returnedPost.media.assets[0].alt = '被修改的图片说明';
    returnedPost.media.assets.pop();

    const nextPost = await repository.getPost('post-history-indiana-contest');

    expect(nextPost?.content).toBe(
      '旧赛场的两张现场照记录了 2008 年参赛者在后台热身与交流的场景。',
    );
    expect(nextPost?.styleTags).toEqual(['1A']);
    expect(nextPost?.hashtags).toEqual(['#赛事影像', '#悠悠球历史']);
    expect(nextPost?.media).toMatchObject({
      type: 'images',
      assets: [
        { alt: '悠悠球比赛现场选手动作照片' },
        { alt: '同场比赛的另一张现场照片' },
      ],
    });
  });
});
