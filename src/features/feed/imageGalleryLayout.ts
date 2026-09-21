export interface ImageGalleryLayout {
  variant: 'empty' | 'single' | 'carousel';
  imageCount: number;
}

export function getImageGalleryLayout(imageCount: number): ImageGalleryLayout {
  const count = Number.isFinite(imageCount) ? Math.max(0, Math.floor(imageCount)) : 0;
  return {
    variant: count === 0 ? 'empty' : count === 1 ? 'single' : 'carousel',
    imageCount: count,
  };
}

export function getSingleImageAspectRatio(sourceAspectRatio: number): number {
  if (!Number.isFinite(sourceAspectRatio) || sourceAspectRatio <= 0) return 4 / 3;
  return Math.min(16 / 9, Math.max(1, sourceAspectRatio));
}
