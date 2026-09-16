import type { PostCategoryId, StyleTagType } from '../../constants/categories';

export type MediaContent =
  | { type: 'none' }
  | {
      type: 'images';
      assets: { id: string; uri: number | string; aspectRatio: number; alt: string }[];
    }
  | {
      type: 'video';
      asset: {
        id: string;
        uri: number | string;
        posterUri: number | string;
        durationSeconds: number;
        aspectRatio: number;
        title: string;
      };
    }
  | {
      type: 'audio';
      asset: {
        id: string;
        uri: number | string;
        coverUri: number | string;
        title: string;
        artist: string;
        bpm: number;
        durationSeconds: number;
      };
    };

export interface SocialUser {
  id: string;
  handle: string;
  displayName: string;
  avatarUri: number | string;
  bio: string;
  city: string;
  styleTags: StyleTagType[];
  roleLabel?: string;
}

export interface SocialPost {
  id: string;
  authorId: string;
  content: string;
  category: PostCategoryId;
  styleTags: StyleTagType[];
  hashtags: string[];
  createdAt: string;
  media: MediaContent;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;
  visibility: 'public' | 'followers';
}

export interface ViewerProfile {
  userId: string;
  interestStyles: StyleTagType[];
  interestCategories: PostCategoryId[];
  followedUserIds: string[];
}

export type RecommendationReason = string | null;
