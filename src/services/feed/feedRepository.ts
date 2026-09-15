import { getApiConfig, type ApiConfig } from '../api/config';
import type { FeedPage, FeedScope, IFeedItem } from '../../types/feed';

export interface FetchFeedParams {
  scope: FeedScope;
  cursor?: string | null;
  limit?: number;
}

interface FeedResponse {
  data: IFeedItem[];
  page: { nextCursor: string | null; hasMore: boolean };
  error?: { message?: string };
}

export function createFeedRepository(
  fetchImpl: typeof fetch = fetch,
  config: ApiConfig | null = getApiConfig(),
) {
  return {
    async fetchFeed({ scope, cursor, limit = 20 }: FetchFeedParams): Promise<FeedPage> {
      if (!config) throw new Error('请先配置 91YOYO API 地址');
      if (scope === 'following') return { items: [], nextCursor: null, hasMore: false };

      const query = new URLSearchParams({ limit: String(Math.min(Math.max(limit, 1), 50)) });
      if (cursor) query.set('cursor', cursor);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

      try {
        const response = await fetchImpl(`${config.baseUrl}/v1/feed?${query.toString()}`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });
        const payload = await response.json() as FeedResponse;
        if (!response.ok) throw new Error(payload.error?.message ?? 'Feed 加载失败，请稍后重试');
        return {
          items: payload.data,
          nextCursor: payload.page.nextCursor,
          hasMore: payload.page.hasMore,
        };
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') throw new Error('请求超时，请检查网络后重试');
        throw error;
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}

export const feedRepository = createFeedRepository();
