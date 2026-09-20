import type { PostCategoryId } from '../../constants/categories';
import type { SocialPost, SocialUser } from '../../features/social/types';

const FRESHNESS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const ENGAGEMENT_SATURATION = 100_000;

export type ExploreCategoryId = 'all' | PostCategoryId;

export interface ExploreResult {
  post: SocialPost;
  author: SocialUser;
  score: number;
}

export interface TrendingTopic {
  label: string;
  count: number;
}

export function partitionExploreResults(results: ExploreResult[]): {
  media: ExploreResult[];
  text: ExploreResult[];
} {
  return {
    media: results.filter(({ post }) => post.media.type !== 'none'),
    text: results.filter(({ post }) => post.media.type === 'none'),
  };
}

function clampUnit(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function timestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
}

function freshness(createdAt: string, now: string): number {
  const createdAtTimestamp = timestamp(createdAt);
  const nowTimestamp = timestamp(now);
  if (!Number.isFinite(createdAtTimestamp) || !Number.isFinite(nowTimestamp)) return 0;
  return clampUnit(1 - (nowTimestamp - createdAtTimestamp) / FRESHNESS_WINDOW_MS);
}

function engagement(post: SocialPost): number {
  const values = [post.likeCount, post.commentCount, post.shareCount, post.viewCount];
  const total = values.reduce(
    (sum, value) => sum + (Number.isFinite(value) && value > 0 ? value : 0),
    0,
  );
  return clampUnit(Math.log1p(total) / Math.log1p(ENGAGEMENT_SATURATION));
}

function matchesQuery(post: SocialPost, author: SocialUser, query: string): boolean {
  const searchText = normalized([
    author.displayName,
    author.handle,
    post.content,
    ...post.hashtags,
  ].join('\n'));
  return searchText.includes(query);
}

export function rankExplorePosts(input: {
  posts: SocialPost[];
  users: SocialUser[];
  category: ExploreCategoryId;
  query: string;
  now: string;
}): ExploreResult[] {
  const usersById = new Map(input.users.map((user) => [user.id, user]));
  const query = normalized(input.query);

  return input.posts
    .flatMap((post) => {
      const author = usersById.get(post.authorId);
      if (!author || post.visibility !== 'public') return [];
      if (query) {
        if (!matchesQuery(post, author, query)) return [];
      } else if (input.category !== 'all' && post.category !== input.category) {
        return [];
      }

      const categoryRelevance = !query && input.category !== 'all' ? 1 : 0;
      const score =
        categoryRelevance * 0.45 +
        engagement(post) * 0.35 +
        freshness(post.createdAt, input.now) * 0.2;

      return [{ post, author, score }];
    })
    .sort((left, right) => {
      const scoreOrder = right.score - left.score;
      if (scoreOrder) return scoreOrder;
      const timeOrder = timestamp(right.post.createdAt) - timestamp(left.post.createdAt);
      if (timeOrder) return timeOrder;
      return left.post.id < right.post.id ? -1 : left.post.id > right.post.id ? 1 : 0;
    });
}

export function getTrendingTopics(
  posts: SocialPost[],
  category: ExploreCategoryId,
  limit: number,
): TrendingTopic[] {
  const counts = new Map<string, number>();

  for (const post of posts) {
    if (post.visibility !== 'public') continue;
    if (category !== 'all' && post.category !== category) continue;
    for (const hashtag of new Set(post.hashtags)) {
      counts.set(hashtag, (counts.get(hashtag) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count || (left.label < right.label ? -1 : 1))
    .slice(0, Math.max(0, limit));
}
