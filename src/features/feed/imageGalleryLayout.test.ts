import { describe, expect, it } from 'vitest';
import { getContainedMediaSize, getImageGalleryLayout, getPreviewAspectRatio } from './imageGalleryLayout';

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

  it('uses a 3:4 preview for portrait media and preserves landscape ratios', () => {
    expect(getPreviewAspectRatio(0.66)).toBe(3 / 4);
    expect(getPreviewAspectRatio(0.85)).toBe(3 / 4);
    expect(getPreviewAspectRatio(1.5)).toBe(1.5);
    expect(getPreviewAspectRatio(16 / 9)).toBe(16 / 9);
    expect(getPreviewAspectRatio(2.4)).toBe(2.4);
    expect(getPreviewAspectRatio(Number.NaN)).toBe(4 / 3);
  });

  it('fits original media inside the full-screen stage without cropping', () => {
    expect(getContainedMediaSize(390, 844, 1.03)).toEqual({ width: 390, height: 379 });
    expect(getContainedMediaSize(390, 844, 9 / 16)).toEqual({ width: 390, height: 693 });
  });
});
