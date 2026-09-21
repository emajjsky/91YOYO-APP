import { describe, expect, it } from 'vitest';
import { getImageGalleryLayout, getMediaPreviewSize, getPreviewAspectRatio } from './imageGalleryLayout';

describe('image gallery layout', () => {
  it.each([
    [0, { variant: 'empty', imageCount: 0 }],
    [1, { variant: 'single', imageCount: 1 }],
    [2, { variant: 'carousel', imageCount: 2 }],
    [3, { variant: 'carousel', imageCount: 3 }],
    [4, { variant: 'carousel', imageCount: 4 }],
    [6, { variant: 'carousel', imageCount: 6 }],
    [9, { variant: 'carousel', imageCount: 9 }],
  ])('uses a carousel instead of a grid for %i images', (count, expected) => {
    expect(getImageGalleryLayout(count)).toEqual(expected);
  });

  it('preserves common source ratios and limits only extreme images', () => {
    expect(getPreviewAspectRatio(0.66)).toBe(3 / 4);
    expect(getPreviewAspectRatio(0.85)).toBe(0.85);
    expect(getPreviewAspectRatio(1.5)).toBe(1.5);
    expect(getPreviewAspectRatio(2.4)).toBe(16 / 9);
    expect(getPreviewAspectRatio(Number.NaN)).toBe(4 / 3);
  });

  it('sizes a vertical video preview from its preserved source ratio', () => {
    expect(getMediaPreviewSize(360, 0.72)).toEqual({ width: 360, height: 480 });
  });
});
