export interface FeedCursor {
  publishedAt: string;
  id: string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function encodeFeedCursor(cursor: FeedCursor): string {
  return encodeURIComponent(JSON.stringify(cursor));
}

export function decodeFeedCursor(value: string): FeedCursor {
  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as Partial<FeedCursor>;
    if (
      typeof parsed.publishedAt !== 'string'
      || Number.isNaN(Date.parse(parsed.publishedAt))
      || typeof parsed.id !== 'string'
      || !UUID_PATTERN.test(parsed.id)
    ) throw new Error('invalid cursor');
    return { publishedAt: parsed.publishedAt, id: parsed.id };
  } catch {
    throw new Error('分页游标无效，请刷新后重试');
  }
}
