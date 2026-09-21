export type SelectableMediaType = 'image' | 'video' | 'music';

const MEDIA_SELECTION_LIMITS: Record<SelectableMediaType, number> = {
  image: 9,
  video: 1,
  music: 1,
};

export function mediaSelectionLimit(type: SelectableMediaType): number {
  return MEDIA_SELECTION_LIMITS[type];
}

export function canAddMedia(type: SelectableMediaType, selectedCount: number): boolean {
  return Math.max(0, selectedCount) < mediaSelectionLimit(type);
}
