export interface ImageGridLayout {
  columns: number;
  rows: number;
  visibleCount: number;
}

const MAX_VISIBLE_IMAGES = 9;

export function getImageGridLayout(imageCount: number): ImageGridLayout {
  const visibleCount = Math.min(MAX_VISIBLE_IMAGES, Math.max(0, Math.floor(imageCount)));
  if (visibleCount <= 1) {
    return { columns: visibleCount, rows: visibleCount, visibleCount };
  }

  const columns = visibleCount <= 4 ? 2 : 3;
  return {
    columns,
    rows: Math.ceil(visibleCount / columns),
    visibleCount,
  };
}

export function getSingleImageAspectRatio(sourceAspectRatio: number): number {
  if (!Number.isFinite(sourceAspectRatio) || sourceAspectRatio <= 0) return 4 / 3;
  return Math.min(16 / 9, Math.max(1, sourceAspectRatio));
}
