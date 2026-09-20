import type { SocialComment } from '../../features/social/types';

export const COMMENT_BODY_LIMIT = 280;

export function commentsForPost(comments: SocialComment[], postId: string): SocialComment[] {
  return comments
    .filter((comment) => comment.postId === postId)
    .sort((left, right) => {
      const timeOrder = Date.parse(left.createdAt) - Date.parse(right.createdAt);
      if (timeOrder) return timeOrder;
      return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
    });
}

export function normalizeCommentBody(value: string): string | null {
  const body = value.trim();
  return body.length > 0 && body.length <= COMMENT_BODY_LIMIT ? body : null;
}
