import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '../supabase/client';
import { mapPostRow } from './feedMapper';
import { decodeFeedCursor, encodeFeedCursor } from './feedCursor';
import type { FeedPage, FeedScope } from '../../types/feed';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function publicUrl(client: SupabaseClient, bucket: string, path?: string | null): string {
  if (!path) return '';
  return client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

async function signedMediaUrls(client: SupabaseClient, rows: Array<Record<string, unknown>>): Promise<Map<string, string>> {
  const paths = rows.flatMap((row) => {
    const mediaRows = (row.post_media ?? []) as Array<{ media_assets?: { bucket?: string; object_path?: string } | null }>;
    return mediaRows.flatMap(({ media_assets }) =>
      media_assets?.bucket && media_assets.object_path
        ? [{ bucket: media_assets.bucket, path: media_assets.object_path }]
        : []
    );
  });
  const urls = new Map<string, string>();

  for (const bucket of [...new Set(paths.map((item) => item.bucket))]) {
    const bucketPaths = [...new Set(paths.filter((item) => item.bucket === bucket).map((item) => item.path))];
    const { data, error } = await client.storage.from(bucket).createSignedUrls(bucketPaths, 60 * 60);
    if (error) throw new Error(error.message || '媒体地址加载失败');
    data.forEach((item, index) => {
      if (item.signedUrl) urls.set(`${bucket}/${bucketPaths[index]}`, item.signedUrl);
    });
  }

  return urls;
}

export interface FetchFeedParams {
  scope: FeedScope;
  cursor?: string | null;
  limit?: number;
}

export const feedRepository = {
  async fetchFeed({ scope, cursor, limit = DEFAULT_LIMIT }: FetchFeedParams): Promise<FeedPage> {
    const client = getSupabaseClient();
    if (!client) throw new Error('请先配置 Supabase 环境变量');

    const pageSize = Math.min(Math.max(limit, 1), MAX_LIMIT);
    let query = client
      .from('posts')
      .select(`
        id, body, category, style_tags, created_at, published_at,
        like_count, comment_count, share_count, bookmark_count,
        profiles (id, nickname, avatar_path, style_tags, level_tag),
        post_media (position, media_assets (id, type, bucket, object_path, poster_path, title, mime_type, can_download, duration_ms, bpm)),
        post_hashtags (hashtags (display_name))
      `)
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('published_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(pageSize + 1);

    if (scope === 'public') query = query.eq('visibility', 'public');
    if (scope === 'following') {
      const { data: authData, error: authError } = await client.auth.getUser();
      if (authError || !authData.user) throw new Error('登录已过期，请重新登录');
      const { data: follows, error: followsError } = await client
        .from('follows')
        .select('followed_id')
        .eq('follower_id', authData.user.id);
      if (followsError) throw new Error(followsError.message || '关注列表加载失败');
      const followedIds = (follows ?? []).map((item) => item.followed_id as string);
      if (followedIds.length === 0) return { items: [], nextCursor: null, hasMore: false };
      query = query.in('author_id', followedIds);
    }
    if (cursor) {
      const decoded = decodeFeedCursor(cursor);
      query = query.or(
        `published_at.lt.${decoded.publishedAt},and(published_at.eq.${decoded.publishedAt},id.lt.${decoded.id})`
      );
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message || 'Feed 加载失败，请稍后重试');

    const rows = (data ?? []) as Array<Record<string, unknown>>;
    const hasMore = rows.length > pageSize;
    const pageRows = rows.slice(0, pageSize);
    const mediaUrls = await signedMediaUrls(client, pageRows);
    const items = pageRows.map((row) => mapPostRow(row, {
      resolveAvatarUrl: (profile) => publicUrl(client, 'avatars', profile.avatar_path),
      resolveMediaUrl: (media) => mediaUrls.get(`${media.bucket ?? 'post-media'}/${media.object_path}`) ?? '',
    }));
    const last = pageRows.at(-1) as { published_at?: string | null; created_at?: string | null; id: string } | undefined;
    const lastPublishedAt = last?.published_at ?? last?.created_at;

    return {
      items,
      hasMore,
      nextCursor: hasMore && last && lastPublishedAt
        ? encodeFeedCursor({ publishedAt: lastPublishedAt, id: last.id })
        : null,
    };
  },
};
