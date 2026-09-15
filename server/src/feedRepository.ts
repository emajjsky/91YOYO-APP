import type pg from 'pg';
import type { FeedPage, FeedService } from './services.js';

interface Cursor {
  publishedAt: string;
  id: string;
}

interface FeedRow {
  id: string;
  body: string;
  category: string;
  style_tags: string[];
  hashtags: string[];
  visibility: string;
  like_count: string;
  comment_count: string;
  share_count: string;
  published_at: Date;
  author_id: string;
  nickname: string;
  avatar_url: string | null;
  author_style_tags: string[];
  level_tag: string | null;
}

function encodeCursor(cursor: Cursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64url');
}

function decodeCursor(value: string): Cursor {
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as Partial<Cursor>;
    if (!parsed.publishedAt || Number.isNaN(Date.parse(parsed.publishedAt)) || !parsed.id) throw new Error();
    return { publishedAt: parsed.publishedAt, id: parsed.id };
  } catch {
    throw new Error('invalid feed cursor');
  }
}

export function createFeedRepository(pool: pg.Pool): FeedService {
  return {
    async listPublic({ limit, cursor }): Promise<FeedPage> {
      const decoded = cursor ? decodeCursor(cursor) : null;
      const values: unknown[] = [limit + 1];
      let cursorWhere = '';
      if (decoded) {
        values.push(decoded.publishedAt, decoded.id);
        cursorWhere = 'and (p.published_at, p.id) < ($2::timestamptz, $3::uuid)';
      }

      const result = await pool.query<FeedRow>(`
        select
          p.id, p.body, p.category, p.style_tags, p.hashtags, p.visibility,
          p.like_count, p.comment_count, p.share_count, p.published_at,
          pr.id as author_id, pr.nickname, pr.avatar_url,
          pr.style_tags as author_style_tags, pr.level_tag
        from posts p
        join profiles pr on pr.id = p.author_id
        where p.status = 'published'
          and p.visibility = 'public'
          and p.deleted_at is null
          and pr.status = 'active'
          ${cursorWhere}
        order by p.published_at desc, p.id desc
        limit $1
      `, values);

      const hasMore = result.rows.length > limit;
      const rows = result.rows.slice(0, limit);
      const items = rows.map((row) => ({
        id: row.id,
        author: {
          uid: row.author_id,
          nickname: row.nickname,
          avatarUrl: row.avatar_url ?? '',
          styleTags: row.author_style_tags,
          levelTag: row.level_tag ?? undefined,
        },
        content: row.body,
        tags: row.hashtags.map((tag) => tag.startsWith('#') ? tag : `#${tag}`),
        category: row.category,
        createdAt: row.published_at.toISOString(),
        likeCount: Number(row.like_count),
        commentCount: Number(row.comment_count),
        shareCount: Number(row.share_count),
        isLiked: false,
        isBookmarked: false,
      }));
      const last = rows.at(-1);

      return {
        items,
        hasMore,
        nextCursor: hasMore && last
          ? encodeCursor({ publishedAt: last.published_at.toISOString(), id: last.id })
          : null,
      };
    },
  };
}
