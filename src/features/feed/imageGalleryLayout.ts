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
  return sourceAspectRatio < 1 ? 3 / 4 : sourceAspectRatio;
}

export function getContainedMediaSize(containerWidth: number, containerHeight: number, sourceAspectRatio: number) {
  const width = Number.isFinite(containerWidth) ? Math.max(0, Math.round(containerWidth)) : 0;
  const height = Number.isFinite(containerHeight) ? Math.max(0, Math.round(containerHeight)) : 0;
  const aspectRatio = Number.isFinite(sourceAspectRatio) && sourceAspectRatio > 0 ? sourceAspectRatio : 4 / 3;
  if (width === 0 || height === 0) return { width: 0, height: 0 };

  const heightLimitedWidth = height * aspectRatio;
  if (heightLimitedWidth <= width) {
    return { width: Math.round(heightLimitedWidth), height };
  }
  return { width, height: Math.round(width / aspectRatio) };
}
