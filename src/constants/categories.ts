export const POST_CATEGORIES = [
  { id: 'daily',      label: '日常分享', emoji: '🎯' },
  { id: 'music',      label: 'YOYO音乐',  emoji: '🎵' },
  { id: 'tutorial',   label: '招式教学',  emoji: '📚' },
  { id: 'contest',    label: '比赛视频',  emoji: '🏆' },
  { id: 'event_news', label: '赛事资讯',  emoji: '🏅' },
  { id: 'product',    label: '产品资讯',  emoji: '📦' },
  { id: 'meetup',     label: '聚会信息',  emoji: '📍' },
] as const;

export type PostCategoryId = typeof POST_CATEGORIES[number]['id'];

export const STYLE_TAGS = ['1A', '2A', '3A', '4A', '5A'] as const;
export type StyleTagType = typeof STYLE_TAGS[number];
