import { describe, expect, it } from 'vitest';
import type { SocialComment } from '../../features/social/types';
import { commentsForPost, normalizeCommentBody } from './postDetailModel';

function comment(id: string, postId: string, createdAt: string): SocialComment {
  return {
    id,
    postId,
    authorId: 'author',
    body: id,
    createdAt,
    likeCount: 0,
  };
}

describe('commentsForPost', () => {
  it('filters by post and returns chronological comments without mutating input', () => {
    const comments = [
      comment('newer', 'post-1', '2026-09-15T11:00:00.000Z'),
      comment('other', 'post-2', '2026-09-15T09:00:00.000Z'),
      comment('older', 'post-1', '2026-09-15T10:00:00.000Z'),
    ];

    expect(commentsForPost(comments, 'post-1').map(({ id }) => id)).toEqual(['older', 'newer']);
    expect(comments.map(({ id }) => id)).toEqual(['newer', 'other', 'older']);
  });
});

describe('normalizeCommentBody', () => {
  it('trims valid comment text', () => {
    expect(normalizeCommentBody('  动作很干净  ')).toBe('动作很干净');
  });

  it('rejects blank comments', () => {
    expect(normalizeCommentBody('   \n')).toBeNull();
  });

  it('accepts 280 characters and rejects 281 characters', () => {
    expect(normalizeCommentBody('a'.repeat(280))).toHaveLength(280);
    expect(normalizeCommentBody('a'.repeat(281))).toBeNull();
  });
});
