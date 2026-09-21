export interface ImageGridLayout {
  variant: 'empty' | 'single' | 'split' | 'featured' | 'quad';
  visibleCount: number;
  overflowCount: number;
}

const MAX_VISIBLE_IMAGES = 4;

export function getImageGridLayout(imageCount: number): ImageGridLayout {
  const count = Math.max(0, Math.floor(imageCount));
  const visibleCount = Math.min(MAX_VISIBLE_IMAGES, count);
  const variants: ImageGridLayout['variant'][] = ['empty', 'single', 'split', 'featured', 'quad'];
  return {
    variant: variants[visibleCount],
    visibleCount,
    overflowCount: Math.max(0, count - visibleCount),
  };
}

export function getSingleImageAspectRatio(sourceAspectRatio: number): number {
  if (!Number.isFinite(sourceAspectRatio) || sourceAspectRatio <= 0) return 4 / 3;
  return Math.min(16 / 9, Math.max(1, sourceAspectRatio));
}
