import type { SocialPost } from '../../features/social/types';

function timestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
}

function compareNewestThenId(left: SocialPost, right: SocialPost): number {
  const timeOrder = timestamp(right.createdAt) - timestamp(left.createdAt);
  if (timeOrder) return timeOrder;
  return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
}

function relationScore(candidate: SocialPost, initial: SocialPost): number {
  const categoryScore = candidate.category === initial.category ? 2 : 0;
  const sharedStyles = candidate.styleTags.filter((style) => initial.styleTags.includes(style)).length;
  return categoryScore + sharedStyles;
}

export function orderVideoPosts(posts: SocialPost[], initialPostId: string): SocialPost[] {
  const videos = posts.filter(
    (post) => post.visibility === 'public' && post.media.type === 'video',
  );
  const initial = videos.find((post) => post.id === initialPostId);

  if (!initial) return [...videos].sort(compareNewestThenId);

  const related = videos
    .filter((post) => post.id !== initial.id)
    .sort((left, right) => {
      const relationOrder = relationScore(right, initial) - relationScore(left, initial);
      return relationOrder || compareNewestThenId(left, right);
    });

  return [initial, ...related];
}
