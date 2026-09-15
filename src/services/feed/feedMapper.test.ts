import { describe, expect, it } from 'vitest';
import { mapPostRow } from './feedMapper';

describe('mapPostRow', () => {
  it('maps a joined database row into the existing feed card model', () => {
    const item = mapPostRow({
      id: 'post_1',
      body: '今天练习 Kwyjibo',
      category: 'tutorial',
      style_tags: ['1A'],
      created_at: '2026-09-15T08:00:00.000Z',
      published_at: '2026-09-15T08:00:00.000Z',
      like_count: 12,
      comment_count: 3,
      share_count: 2,
      bookmark_count: 4,
      profiles: {
        id: 'user_1',
        nickname: '练习者',
        avatar_path: 'avatars/user_1.jpg',
        style_tags: ['1A', '5A'],
        level_tag: '进阶',
      },
      post_media: [
        {
          position: 0,
          media_assets: {
            id: 'media_1',
            type: 'image',
            public_url: 'https://cdn.example.com/practice.jpg',
            mime_type: 'image/jpeg',
            can_download: false,
          },
        },
      ],
      post_hashtags: [{ hashtags: { display_name: '招式教学' } }],
    });

    expect(item).toMatchObject({
      id: 'post_1',
      content: '今天练习 Kwyjibo',
      category: 'tutorial',
      likeCount: 12,
      commentCount: 3,
      shareCount: 2,
      isLiked: false,
      isBookmarked: false,
      author: {
        uid: 'user_1',
        nickname: '练习者',
        styleTags: ['1A', '5A'],
        levelTag: '进阶',
      },
      images: [{ url: 'https://cdn.example.com/practice.jpg' }],
      tags: ['#招式教学'],
    });
  });
});
