import type { SocialPost } from '../../features/social/types';

export function postsForUser(posts: SocialPost[], userId: string): SocialPost[] {
  return posts
    .filter((post) => post.authorId === userId)
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
}
