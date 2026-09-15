import type { PostCategoryId, StyleTagType } from '../constants/categories';

export interface IFeedAuthor {
  uid: string;
  nickname: string;
  avatarUrl: string;
  styleTags: StyleTagType[];      // 擅长花式，1A-5A 多选（替代旧 levelTag）
  levelTag?: string;              // 保留兼容（如 'CYSO选手'、'藏家' 等特殊标签）
  brandCertification?: {          // 品牌认证（v1.5）
    brandName: string;
    role: '队员' | '大使';
    logoUrl?: string;
  };
}

export interface IFeedVideo {
  id: string;
  url: string;
  title: string;
  posterUrl: string;
  canDownload?: boolean;          // 发布者设置：是否允许下载
}

export interface IFeedImage {
  url: string;
  name?: string;
}

export interface IFeedAudio {
  id: string;
  title: string;
  bpm: number;
  durationText: string;
  src: string;
  tag?: string;
  coverImgUrl?: string;
}

export interface IFeedItem {
  id: string;
  author: IFeedAuthor;
  content: string;
  tags: string[];                 // Hashtag 列表
  category: PostCategoryId;       // 帖子分类（7选1）
  createdAt: string;              // ISO 时间字符串 或 已格式化字符串（mock）
  video?: IFeedVideo;
  images?: IFeedImage[];
  audio?: IFeedAudio;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
}
