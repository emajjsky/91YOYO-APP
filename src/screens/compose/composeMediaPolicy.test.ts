import { describe, expect, it } from 'vitest';
import { canAddMedia, mediaSelectionLimit } from './composeMediaPolicy';

describe('compose media policy', () => {
  it('allows at most nine images', () => {
    expect(mediaSelectionLimit('image')).toBe(9);
    expect(canAddMedia('image', 8)).toBe(true);
    expect(canAddMedia('image', 9)).toBe(false);
  });

  it('allows only one video', () => {
    expect(mediaSelectionLimit('video')).toBe(1);
    expect(canAddMedia('video', 0)).toBe(true);
    expect(canAddMedia('video', 1)).toBe(false);
  });
});
