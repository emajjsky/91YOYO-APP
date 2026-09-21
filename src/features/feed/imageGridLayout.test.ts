import { describe, expect, it } from 'vitest';
import { getImageGridLayout, getSingleImageAspectRatio } from './imageGridLayout';

describe('image grid layout', () => {
  it.each([
    [0, { variant: 'empty', visibleCount: 0, overflowCount: 0 }],
    [1, { variant: 'single', visibleCount: 1, overflowCount: 0 }],
    [2, { variant: 'split', visibleCount: 2, overflowCount: 0 }],
    [3, { variant: 'featured', visibleCount: 3, overflowCount: 0 }],
    [4, { variant: 'quad', visibleCount: 4, overflowCount: 0 }],
  ])('selects the X-style layout for %i images', (count, expected) => {
    expect(getImageGridLayout(count)).toEqual(expected);
  });

  it.each([
    [6, { variant: 'quad', visibleCount: 4, overflowCount: 2 }],
    [9, { variant: 'quad', visibleCount: 4, overflowCount: 5 }],
    [12, { variant: 'quad', visibleCount: 4, overflowCount: 8 }],
  ])('shows four tiles and an overflow count for %i images', (count, expected) => {
    expect(getImageGridLayout(count)).toEqual(expected);
  });

  it('keeps single images compact while respecting common source ratios', () => {
    expect(getSingleImageAspectRatio(0.66)).toBe(1);
    expect(getSingleImageAspectRatio(1.5)).toBe(1.5);
    expect(getSingleImageAspectRatio(2.4)).toBe(16 / 9);
  });
});
