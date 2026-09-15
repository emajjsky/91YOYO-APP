import type { IFeedItem } from '../../types/feed';

export function findPostById(posts: IFeedItem[], postId: string): IFeedItem | undefined {
  return posts.find((post) => post.id === postId);
}
