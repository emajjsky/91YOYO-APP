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

export function getPreviewAspectRatio(sourceAspectRatio: number): number {
  if (!Number.isFinite(sourceAspectRatio) || sourceAspectRatio <= 0) return 4 / 3;
  return Math.min(16 / 9, Math.max(3 / 4, sourceAspectRatio));
}

export function getMediaPreviewSize(containerWidth: number, sourceAspectRatio: number) {
  const width = Number.isFinite(containerWidth) ? Math.max(0, Math.round(containerWidth)) : 0;
  const aspectRatio = getPreviewAspectRatio(sourceAspectRatio);
  return {
    width,
    height: width > 0 ? Math.round(width / aspectRatio) : 0,
  };
}
