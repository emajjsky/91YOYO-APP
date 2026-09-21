import { describe, expect, it } from 'vitest';
import { getImageGalleryLayout, getSingleImageAspectRatio } from './imageGalleryLayout';

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

  it('keeps single images compact while respecting common source ratios', () => {
    expect(getSingleImageAspectRatio(0.66)).toBe(1);
    expect(getSingleImageAspectRatio(1.5)).toBe(1.5);
    expect(getSingleImageAspectRatio(2.4)).toBe(16 / 9);
  });
});
