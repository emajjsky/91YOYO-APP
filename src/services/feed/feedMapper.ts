import type { IFeedItem, IFeedAuthor, IFeedAudio, IFeedVideo } from '../../types/feed';
import type { PostCategoryId, StyleTagType } from '../../constants/categories';

interface MediaRow {
  id?: string;
  type?: 'image' | 'video' | 'audio' | string;
  bucket?: string | null;
  public_url?: string | null;
  url?: string | null;
  object_path?: string | null;
  poster_url?: string | null;
  title?: string | null;
  mime_type?: string | null;
  can_download?: boolean | null;
  duration_ms?: number | null;
  bpm?: number | null;
  tag?: string | null;
}

interface PostMediaRow {
  position?: number | null;
  media_assets?: MediaRow | MediaRow[] | null;
}

interface PostRow {
  id: string;
  body?: string | null;
  content?: string | null;
  category: string;
  style_tags?: string[] | null;
  created_at?: string | null;
  published_at?: string | null;
  like_count?: number | null;
  comment_count?: number | null;
  share_count?: number | null;
  bookmark_count?: number | null;
  viewer_liked?: boolean | null;
  viewer_bookmarked?: boolean | null;
  profiles?: {
    id?: string;
    nickname?: string;
    avatar_url?: string | null;
    avatar_path?: string | null;
    style_tags?: string[] | null;
    level_tag?: string | null;
  } | null;
  post_media?: PostMediaRow[] | null;
  post_hashtags?: Array<{ hashtags?: { display_name?: string | null } | null }> | null;
}

export interface FeedMapperOptions {
  resolveAvatarUrl?: (profile: NonNullable<PostRow['profiles']>) => string;
  resolveMediaUrl?: (media: MediaRow) => string;
}

function asPostRow(row: unknown): PostRow {
  return row as PostRow;
}

function asStyleTags(tags: string[] | null | undefined): StyleTagType[] {
  return (tags ?? []).filter((tag): tag is StyleTagType =>
    ['1A', '2A', '3A', '4A', '5A'].includes(tag)
  );
}

function asMediaRows(rows: PostMediaRow[] | null | undefined): MediaRow[] {
  return (rows ?? [])
    .slice()
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .flatMap((row) => {
      if (!row.media_assets) return [];
      return Array.isArray(row.media_assets) ? row.media_assets : [row.media_assets];
    });
}

function mediaUrl(media: MediaRow, options: FeedMapperOptions): string {
  return options.resolveMediaUrl?.(media)
    ?? media.public_url
    ?? media.url
    ?? media.object_path
    ?? '';
}

function durationText(durationMs?: number | null): string {
  const totalSeconds = Math.max(0, Math.round((durationMs ?? 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function mapPostRow(row: unknown, options: FeedMapperOptions = {}): IFeedItem {
  const post = asPostRow(row);
  const profile = post.profiles ?? {};
  const media = asMediaRows(post.post_media);
  const images = media.filter((asset) => asset.type === 'image');
  const video = media.find((asset) => asset.type === 'video');
  const audio = media.find((asset) => asset.type === 'audio');

  const author: IFeedAuthor = {
    uid: profile.id ?? '',
    nickname: profile.nickname ?? '91YOYO 球友',
    avatarUrl: options.resolveAvatarUrl?.(profile) ?? profile.avatar_url ?? profile.avatar_path ?? '',
    styleTags: asStyleTags(profile.style_tags),
    levelTag: profile.level_tag ?? undefined,
  };

  const item: IFeedItem = {
    id: post.id,
    author,
    content: post.body ?? post.content ?? '',
    tags: (post.post_hashtags ?? [])
      .map((item) => item.hashtags?.display_name)
      .filter((tag): tag is string => Boolean(tag))
      .map((tag) => tag.startsWith('#') ? tag : `#${tag}`),
    category: post.category as PostCategoryId,
    createdAt: post.published_at ?? post.created_at ?? new Date(0).toISOString(),
    likeCount: post.like_count ?? 0,
    commentCount: post.comment_count ?? 0,
    shareCount: post.share_count ?? 0,
    isLiked: post.viewer_liked ?? false,
    isBookmarked: post.viewer_bookmarked ?? false,
  };

  if (images.length > 0) {
    item.images = images.map((asset) => ({ url: mediaUrl(asset, options) }));
  }

  if (video) {
    const url = mediaUrl(video, options);
    const mappedVideo: IFeedVideo = {
      id: video.id ?? `${post.id}-video`,
      url,
      title: video.title ?? '招式练习视频',
      posterUrl: video.poster_url ?? url,
      canDownload: video.can_download ?? false,
    };
    item.video = mappedVideo;
  }

  if (audio) {
    const mappedAudio: IFeedAudio = {
      id: audio.id ?? `${post.id}-audio`,
      title: audio.title ?? '练习伴奏',
      bpm: audio.bpm ?? 0,
      durationText: durationText(audio.duration_ms),
      src: mediaUrl(audio, options),
      tag: audio.tag ?? undefined,
    };
    item.audio = mappedAudio;
  }

  return item;
}
