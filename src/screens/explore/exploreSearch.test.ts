import { describe, expect, it } from 'vitest';
import { filterExploreItems } from './exploreSearch';

const items = [
  { id: '1', title: 'Kwyjibo 分步拆解', desc: '附慢放视频', likes: 12 },
  { id: '2', title: '北京周末 Jam', desc: '朝阳公园见', likes: 8 },
];

describe('filterExploreItems', () => {
  it('returns every item for a blank query', () => {
    expect(filterExploreItems(items, '  ')).toEqual(items);
  });

  it('matches title and description without case sensitivity', () => {
    expect(filterExploreItems(items, 'KWYJIBO')).toEqual([items[0]]);
    expect(filterExploreItems(items, '公园')).toEqual([items[1]]);
  });

  it('returns an empty result when nothing matches', () => {
    expect(filterExploreItems(items, '不存在内容')).toEqual([]);
  });
});
