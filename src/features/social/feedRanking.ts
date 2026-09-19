import { POST_CATEGORIES } from '../../constants/categories';
import type { SocialPost, SocialUser, ViewerProfile } from './types';

const FRESHNESS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const ENGAGEMENT_SATURATION = 100_000;
const CANONICAL_ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export interface RankedPost {
  post: SocialPost;
  score: number;
  reason: string | null;
}

interface RankingSignals {
  matchedStyle: string | null;
  matchedCategory: boolean;
  interestMatch: number;
  freshness: number;
  engagement: number;
  relationship: number;
}

function clampUnit(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function parseTimestamp(value: string): number | null {
  if (!CANONICAL_ISO_TIMESTAMP.test(value)) return null;

  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;

  return new Date(timestamp).toISOString() === value ? timestamp : null;
}

function calculateFreshness(createdAt: string, now: string): number {
  const createdAtTimestamp = parseTimestamp(createdAt);
  const nowTimestamp = parseTimestamp(now);

  if (createdAtTimestamp === null || nowTimestamp === null) return 0;

  return clampUnit(1 - (nowTimestamp - createdAtTimestamp) / FRESHNESS_WINDOW_MS);
}

function nonNegativeFinite(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function calculateEngagement(post: SocialPost): number {
  const total =
    nonNegativeFinite(post.likeCount) +
    nonNegativeFinite(post.commentCount) +
    nonNegativeFinite(post.shareCount) +
    nonNegativeFinite(post.viewCount);

  return clampUnit(Math.log1p(total) / Math.log1p(ENGAGEMENT_SATURATION));
}

function calculateSignals(post: SocialPost, viewer: ViewerProfile, now: string): RankingSignals {
  const matchedStyle =
    post.styleTags.find((style) => viewer.interestStyles.includes(style)) ?? null;
  const matchedCategory = viewer.interestCategories.includes(post.category);

  return {
    matchedStyle,
    matchedCategory,
    interestMatch: ((matchedStyle === null ? 0 : 1) + (matchedCategory ? 1 : 0)) / 2,
    freshness: calculateFreshness(post.createdAt, now),
    engagement: calculateEngagement(post),
    relationship: viewer.followedUserIds.includes(post.authorId) ? 1 : 0,
  };
}

function recommendationReason(
  post: SocialPost,
  signals: RankingSignals,
  usersById: ReadonlyMap<string, SocialUser>,
): string | null {
  if (signals.relationship === 1) return null;

  const freshnessContribution = signals.freshness * 0.25;
  const engagementContribution = signals.engagement * 0.2;

  if (signals.matchedStyle !== null) {
    return `因为你喜欢 ${signals.matchedStyle}`;
  }

  if (signals.matchedCategory) {
    const category = POST_CATEGORIES.find((item) => item.id === post.category);
    return category ? `因为你关注${category.label}` : null;
  }

  if (freshnessContribution >= engagementContribution && signals.freshness > 0) {
    const author = usersById.get(post.authorId);
    return author ? `来自${author.displayName}的新动态` : '最近发布';
  }

  if (signals.engagement > 0) {
    return '社区热度较高';
  }

  return null;
}

function comparePostsByCreatedAtThenId(left: SocialPost, right: SocialPost): number {
  const leftTimestamp = parseTimestamp(left.createdAt) ?? Number.NEGATIVE_INFINITY;
  const rightTimestamp = parseTimestamp(right.createdAt) ?? Number.NEGATIVE_INFINITY;
  const timestampOrder = rightTimestamp - leftTimestamp;

  if (timestampOrder) return timestampOrder;
  if (left.id === right.id) return 0;
  return left.id < right.id ? -1 : 1;
}

export function rankRecommendedPosts(input: {
  posts: SocialPost[];
  users: SocialUser[];
  viewer: ViewerProfile;
  now: string;
}): RankedPost[] {
  const usersById = new Map(input.users.map((user) => [user.id, user]));

  return input.posts
    .filter(
      (post) => post.authorId !== input.viewer.userId || post.visibility === 'public',
    )
    .map((post) => {
      const signals = calculateSignals(post, input.viewer, input.now);
      const score =
        signals.interestMatch * 0.4 +
        signals.freshness * 0.25 +
        signals.engagement * 0.2 +
        signals.relationship * 0.15;

      return {
        post,
        score,
        reason: recommendationReason(post, signals, usersById),
      };
    })
    .sort(
      (left, right) =>
        right.score - left.score || comparePostsByCreatedAtThenId(left.post, right.post),
    );
}

export function selectFollowingPosts(
  posts: SocialPost[],
  viewer: ViewerProfile,
): SocialPost[] {
  return posts
    .filter((post) => viewer.followedUserIds.includes(post.authorId))
    .sort(comparePostsByCreatedAtThenId);
}
