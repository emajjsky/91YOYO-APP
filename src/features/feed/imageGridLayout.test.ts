import { describe, expect, it } from 'vitest';
import { getImageGridLayout, getSingleImageAspectRatio } from './imageGridLayout';

describe('image grid layout', () => {
  it.each([
    [4, { columns: 2, rows: 2, visibleCount: 4 }],
    [6, { columns: 3, rows: 2, visibleCount: 6 }],
    [9, { columns: 3, rows: 3, visibleCount: 9 }],
  ])('uses a complete grid for %i images', (count, expected) => {
    expect(getImageGridLayout(count)).toEqual(expected);
  });

  it('caps albums at nine visible images', () => {
    expect(getImageGridLayout(12)).toEqual({ columns: 3, rows: 3, visibleCount: 9 });
  });

  it('keeps single images compact while respecting common source ratios', () => {
    expect(getSingleImageAspectRatio(0.66)).toBe(1);
    expect(getSingleImageAspectRatio(1.5)).toBe(1.5);
    expect(getSingleImageAspectRatio(2.4)).toBe(16 / 9);
  });
});
